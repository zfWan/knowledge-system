import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TokenBlacklist } from '../../common/utils/token-blacklist';
import {
  newAuditId,
  newQuotaId,
  newRefreshToken,
  newRefreshTokenId,
  newSmsCode,
  newSmsCodeId,
  newUserId,
} from '../../common/utils/nanoid';
import {
  ACCESS_TTL_SECONDS,
  ARGON2_OPTIONS,
  LOCK_DURATION_MS,
  LOGIN_FAIL_MAX,
  REFRESH_TTL_DEFAULT_SECONDS,
  REFRESH_TTL_REMEMBER_SECONDS,
  SMS_CODE_TTL_SECONDS,
  SMS_DAILY_LIMIT,
  SMS_FAIL_MAX,
  SMS_SEND_COOLDOWN_MS,
} from './auth.constants';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, isEmail, isPhone } from './dto/login.dto';
import { SmsLoginDto } from './dto/sms-login.dto';
import { SmsSendDto } from './dto/sms-send.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const maskPhone = (p: string) => `用户****${p.slice(-4)}`;
const maskEmail = (e: string) => {
  const [name, domain] = e.split('@');
  if (!domain) return e;
  const masked = name.length <= 2 ? name[0] + '*' : name[0] + '***' + name.slice(-1);
  return `${masked}@${domain}`;
};

export interface UserView {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  avatarUrl: string | null;
  status: string;
  createdAt: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserView;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private placeholderHash: string | null = null;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private blacklist: TokenBlacklist,
  ) {}

  async onModuleInit() {
    // 生成一个不可登录的占位 hash（即注册即登录无密码场景）
    this.placeholderHash = await argon2.hash(
      '__NO_PASSWORD__' + Math.random().toString(36) + Date.now().toString(36),
      ARGON2_OPTIONS,
    );
  }

  // ---------- 注册 ----------
  async register(dto: RegisterDto, ip?: string, ua?: string): Promise<TokenPair> {
    if (dto.type === 'email') {
      if (!dto.email) throw new BadRequestException({ code: 10001, message: '请输入邮箱' });
      if (dto.confirmPassword !== dto.password) {
        throw new BadRequestException({ code: 10001, message: '两次输入的密码不一致' });
      }
      return this.registerByEmail(dto.email.toLowerCase(), dto.password, !!dto.rememberMe, ip, ua);
    } else {
      if (!dto.phone) throw new BadRequestException({ code: 10001, message: '请输入手机号' });
      if (!dto.smsCode) throw new BadRequestException({ code: 10001, message: '请输入验证码' });
      return this.registerByPhone(dto.phone, dto.smsCode, dto.password, !!dto.rememberMe, ip, ua);
    }
  }

  private async registerByEmail(
    email: string,
    password: string,
    rememberMe: boolean,
    ip?: string,
    ua?: string,
  ): Promise<TokenPair> {
    const exist = await this.prisma.user.findUnique({ where: { email } });
    if (exist) {
      await this.audit(null, maskEmail(email), 'register', 'fail', '10101', 'email_exists', ip, ua);
      throw new ConflictException({ code: 10101, message: '该邮箱已注册，请直接登录' });
    }
    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
    const nickname = email.split('@')[0].slice(0, 32) || '用户';
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          id: newUserId(),
          email,
          passwordHash,
          nickname,
          status: 'active',
          failedAttempts: 0,
        },
      });
      await tx.quotaDaily.create({
        data: {
          id: newQuotaId(),
          userId: u.id,
          date: this.todayStr(),
          used: 0,
          limit: u.quotaDailyLimit,
        },
      });
      return u;
    });
    await this.audit(user.id, maskEmail(email), 'register', 'success', undefined, undefined, ip, ua);
    return this.issueTokenPair(user, rememberMe, ip, ua);
  }

  private async registerByPhone(
    phone: string,
    smsCode: string,
    password: string,
    rememberMe: boolean,
    ip?: string,
    ua?: string,
  ): Promise<TokenPair> {
    const exist = await this.prisma.user.findUnique({ where: { phone } });
    if (exist) {
      await this.audit(null, maskPhone(phone), 'register', 'fail', '10101', 'phone_exists', ip, ua);
      throw new ConflictException({ code: 10101, message: '该手机号已注册，请直接登录' });
    }
    // 校验并消耗验证码
    await this.consumeSmsCode(phone, 'register', smsCode);

    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
    const nickname = maskPhone(phone);
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          id: newUserId(),
          phone,
          passwordHash,
          nickname,
          status: 'active',
          failedAttempts: 0,
        },
      });
      await tx.quotaDaily.create({
        data: {
          id: newQuotaId(),
          userId: u.id,
          date: this.todayStr(),
          used: 0,
          limit: u.quotaDailyLimit,
        },
      });
      return u;
    });
    await this.audit(user.id, maskPhone(phone), 'register', 'success', undefined, undefined, ip, ua);
    return this.issueTokenPair(user, rememberMe, ip, ua);
  }

  // ---------- 密码登录 ----------
  async login(dto: LoginDto, ip?: string, ua?: string): Promise<TokenPair> {
    const account = dto.account.trim();
    const where = isEmail(account)
      ? { email: account.toLowerCase() }
      : isPhone(account)
      ? { phone: account }
      : null;
    if (!where) {
      // 账号格式既不是邮箱也不是手机号，直接报错（不区分）
      await this.audit(null, account, 'login', 'fail', '10102', 'invalid_account', ip, ua);
      throw new UnauthorizedException({ code: 10102, message: '账号或密码错误' });
    }
    const user = await this.prisma.user.findUnique({ where });
    // 锁定检查（先于密码校验）
    if (user && user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      await this.audit(user.id, this.maskAccount(user), 'login', 'fail', '10103', 'locked', ip, ua);
      throw new ForbiddenException({
        code: 10103,
        message: `账号已锁定，请 ${Math.max(1, remaining)} 分钟后再试`,
        data: { remainingMinutes: Math.max(1, remaining) },
      });
    }
    // 锁定过期自动解锁
    if (user && user.lockedUntil && user.lockedUntil.getTime() <= Date.now()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: 'active', lockedUntil: null, failedAttempts: 0 },
      });
      user.status = 'active';
      user.lockedUntil = null;
      user.failedAttempts = 0;
    }

    if (!user) {
      await this.audit(null, this.maskAccountStr(account), 'login', 'fail', '10102', 'account_not_found', ip, ua);
      throw new UnauthorizedException({ code: 10102, message: '账号或密码错误' });
    }
    // 无密码占位（短信即注册即登录，不允许密码登录）
    let passwordOk = false;
    if (user.passwordHash && user.passwordHash !== this.placeholderHash) {
      try {
        passwordOk = await argon2.verify(user.passwordHash, dto.password);
      } catch {
        passwordOk = false;
      }
    }
    if (!passwordOk) {
      await this.recordLoginFailure(user, this.maskAccount(user), ip, ua);
      throw new UnauthorizedException({ code: 10102, message: '账号或密码错误' });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lastLoginAt: new Date() },
    });
    await this.audit(user.id, this.maskAccount(user), 'login_success', 'success', undefined, undefined, ip, ua);
    return this.issueTokenPair(user, !!dto.rememberMe, ip, ua);
  }

  // ---------- 短信验证码登录（含即注册即登录） ----------
  async loginBySms(dto: SmsLoginDto, ip?: string, ua?: string): Promise<TokenPair> {
    const phone = dto.phone;
    let user = await this.prisma.user.findUnique({ where: { phone } });
    // 锁定检查
    if (user && user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      await this.audit(user.id, maskPhone(phone), 'login', 'fail', '10103', 'locked', ip, ua);
      throw new ForbiddenException({
        code: 10103,
        message: `账号已锁定，请 ${Math.max(1, remaining)} 分钟后再试`,
        data: { remainingMinutes: Math.max(1, remaining) },
      });
    }
    if (user && user.lockedUntil && user.lockedUntil.getTime() <= Date.now()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: 'active', lockedUntil: null, failedAttempts: 0 },
      });
      user.status = 'active';
      user.lockedUntil = null;
      user.failedAttempts = 0;
    }

    // 校验并消耗验证码
    try {
      await this.consumeSmsCode(phone, 'login', dto.smsCode, user?.id);
    } catch (err) {
      // 失败计数
      if (user) await this.recordLoginFailure(user, maskPhone(phone), ip, ua, 'sms');
      else await this.audit(null, maskPhone(phone), 'login', 'fail', '10104', 'sms_invalid', ip, ua);
      throw err;
    }

    // 未注册 → 即注册即登录
    if (!user) {
      if (!this.config.get<boolean>('allowRegistration')) {
        throw new ForbiddenException({ code: 10301, message: '当前实例未开放注册' });
      }
      const placeholder = this.placeholderHash;
      if (!placeholder) throw new InternalServerErrorException('auth not initialized');
      user = await this.prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            id: newUserId(),
            phone,
            passwordHash: placeholder,
            nickname: maskPhone(phone),
            status: 'active',
            failedAttempts: 0,
          },
        });
        await tx.quotaDaily.create({
          data: {
            id: newQuotaId(),
            userId: u.id,
            date: this.todayStr(),
            used: 0,
            limit: u.quotaDailyLimit,
          },
        });
        return u;
      });
      await this.audit(user.id, maskPhone(phone), 'register', 'success', undefined, 'auto_sms', ip, ua);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lastLoginAt: new Date() },
    });
    await this.audit(user.id, maskPhone(phone), 'login_success', 'success', undefined, 'sms', ip, ua);
    return this.issueTokenPair(user, !!dto.rememberMe, ip, ua);
  }

  // ---------- 发送短信验证码 ----------
  async sendSms(dto: SmsSendDto): Promise<{ expiresIn: number; cooldown: number }> {
    const phone = dto.phone;
    const scene = dto.scene;
    const now = Date.now();

    // 查找最近一条未使用、未过期的验证码记录
    const last = await this.prisma.smsCode.findFirst({
      where: { phone, scene },
      orderBy: { createdAt: 'desc' },
    });

    if (last && last.lastSentAt && now - last.lastSentAt.getTime() < SMS_SEND_COOLDOWN_MS) {
      const remain = Math.ceil((SMS_SEND_COOLDOWN_MS - (now - last.lastSentAt.getTime())) / 1000);
      throw new BadRequestException({ code: 10105, message: `请 ${remain} 秒后再试`, data: { cooldown: remain } });
    }
    // 当日发送次数
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const todayCount = await this.prisma.smsCode.count({
      where: { phone, scene, createdAt: { gte: dayStart } },
    });
    if (todayCount >= SMS_DAILY_LIMIT) {
      throw new BadRequestException({ code: 10106, message: '验证码发送次数已达今日上限，请明天再试' });
    }

    const code = newSmsCode();
    const codeHash = await argon2.hash(code, { ...ARGON2_OPTIONS, timeCost: 1 });
    const expiresAt = new Date(now + SMS_CODE_TTL_SECONDS * 1000);
    await this.prisma.smsCode.create({
      data: {
        id: newSmsCodeId(),
        phone,
        scene,
        codeHash,
        expiresAt,
        failCount: 0,
        dailyCount: todayCount + 1,
        lastSentAt: new Date(now),
      },
    });

    if (this.config.get<string>('nodeEnv') !== 'production') {
      this.logger.log(`[SMS Dev] phone=${phone} code=${code}`);
    } else {
      // 生产：调用 SmsService（本期预留，不接入真实商）
      this.logger.log({ phone, scene }, 'sms code sent (production: noop)');
    }

    return { expiresIn: SMS_CODE_TTL_SECONDS, cooldown: Math.floor(SMS_SEND_COOLDOWN_MS / 1000) };
  }

  private async consumeSmsCode(
    phone: string,
    scene: string,
    code: string,
    userId?: string,
  ) {
    // 取最近一条未使用且未过期的验证码
    const record = await this.prisma.smsCode.findFirst({
      where: { phone, scene, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) {
      throw new BadRequestException({ code: 10104, message: '验证码错误或已过期，请重新获取' });
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException({ code: 10104, message: '验证码错误或已过期，请重新获取' });
    }
    let ok = false;
    try {
      ok = await argon2.verify(record.codeHash, code);
    } catch {
      ok = false;
    }
    if (!ok) {
      const newFail = record.failCount + 1;
      await this.prisma.smsCode.update({
        where: { id: record.id },
        data: {
          failCount: newFail,
          // 5 次失败立即失效（usedAt 置为当前时间标记为失效）
          usedAt: newFail >= SMS_FAIL_MAX ? new Date() : undefined,
        },
      });
      throw new BadRequestException({ code: 10104, message: '验证码错误或已过期，请重新获取' });
    }
    // 正确 → 标记已使用
    await this.prisma.smsCode.update({
      where: { id: record.id },
      data: { usedAt: new Date(), userId: userId ?? record.userId },
    });
  }

  // ---------- refresh ----------
  async refresh(dto: RefreshDto, ip?: string, ua?: string): Promise<TokenPair & { userId: string }> {
    const token = dto.refreshToken;
    const tokenHash = sha256(token);
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!record) {
      throw new UnauthorizedException({ code: 10202, message: '登录已过期，请重新登录' });
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({ code: 10202, message: '登录已过期，请重新登录' });
    }
    if (record.revokedAt) {
      // Refresh token 重用检测：吊销该用户所有 refresh token
      await this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit(record.userId, undefined, 'refresh', 'fail', '10202', 'reuse_detected', ip, ua);
      throw new UnauthorizedException({ code: 10202, message: '登录已过期，请重新登录' });
    }
    // 轮换：吊销旧 token
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    const { accessToken, refreshToken: newRefresh, expiresIn, user } = await this.issueTokenPair(
      record.user,
      record.expiresAt.getTime() - Date.now() > REFRESH_TTL_DEFAULT_SECONDS * 1000,
      ip,
      ua,
      false, // 不更新 lastLoginAt
    );
    await this.audit(record.user.id, undefined, 'refresh', 'success', undefined, undefined, ip, ua);
    return { accessToken, refreshToken: newRefresh, expiresIn, user, userId: record.user.id };
  }

  // ---------- logout ----------
  async logout(userId: string, jti: string, accessToken: string, dto: LogoutDto) {
    // access token 加入黑名单
    try {
      const decoded = this.jwt.verify(accessToken, {
        secret: this.config.get<string>('jwtSecret'),
      }) as { exp: number; jti: string };
      const ttl = (decoded.exp ?? 0) * 1000 - Date.now();
      if (ttl > 0) {
        this.blacklist.add(jti || decoded.jti, decoded.exp * 1000);
      }
    } catch {
      // token 解析失败也忽略，用户反正要登出
    }
    // 吊销 refresh token（若提供）
    if (dto.refreshToken) {
      const tokenHash = sha256(dto.refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return;
  }

  // ---------- 内部辅助 ----------

  private async issueTokenPair(
    user: { id: string; email: string | null; phone: string | null; nickname: string; avatarUrl: string | null; status: string; createdAt: Date },
    rememberMe: boolean,
    ip?: string,
    ua?: string,
    updateLastLogin = true,
  ): Promise<TokenPair> {
    const jti = newRefreshTokenId();
    const now = Math.floor(Date.now() / 1000);
    const accessTtl = ACCESS_TTL_SECONDS;
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, jti },
      { secret: this.config.get<string>('jwtSecret'), expiresIn: accessTtl },
    );
    const refreshTtl = rememberMe ? REFRESH_TTL_REMEMBER_SECONDS : REFRESH_TTL_DEFAULT_SECONDS;
    const refreshToken = newRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        id: newRefreshTokenId(),
        userId: user.id,
        tokenHash: sha256(refreshToken),
        userAgent: ua,
        ip,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });
    if (updateLastLogin) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }).catch(() => null);
    }
    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtl,
      user: this.sanitizeUser(user),
    };
  }

  private sanitizeUser(u: any): UserView {
    return {
      id: u.id,
      email: u.email ?? null,
      phone: u.phone ?? null,
      nickname: u.nickname,
      avatarUrl: u.avatarUrl ?? null,
      status: u.status,
      createdAt: u.createdAt,
    };
  }

  private async recordLoginFailure(
    user: { id: string; failedAttempts: number },
    account: string,
    ip?: string,
    ua?: string,
    reason = 'bad_password',
  ) {
    const next = user.failedAttempts + 1;
    if (next >= LOGIN_FAIL_MAX) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: next,
          status: 'locked',
          lockedUntil: new Date(Date.now() + LOCK_DURATION_MS),
        },
      });
      await this.audit(user.id, account, 'locked', 'fail', '10103', reason, ip, ua);
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: next },
      });
      await this.audit(user.id, account, 'login', 'fail', '10102', reason, ip, ua);
    }
  }

  private async audit(
    userId: string | null,
    account: string | undefined,
    action: string,
    result: 'success' | 'fail',
    errorCode?: string,
    reason?: string,
    ip?: string,
    ua?: string,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: newAuditId(),
          userId: userId ?? undefined,
          account,
          action,
          ip,
          userAgent: ua,
          result,
          errorCode,
          reason,
        },
      });
    } catch (e) {
      this.logger.error({ err: e }, 'audit write failed');
    }
  }

  private maskAccount(user: { email?: string | null; phone?: string | null }): string {
    if (user.email) return maskEmail(user.email);
    if (user.phone) return maskPhone(user.phone);
    return '';
  }
  private maskAccountStr(s: string): string {
    if (isEmail(s)) return maskEmail(s);
    if (isPhone(s)) return maskPhone(s);
    return s;
  }

  private todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
