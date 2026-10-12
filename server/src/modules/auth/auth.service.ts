import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import argon2 from 'argon2';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../common/prisma/prisma.service';
import { parseTtl } from '../../common/utils/ttl';
import { tokenBlacklist } from '../../common/guards/token-blacklist';

export interface AuthUser {
  id: string;
  email: string | null;
  nickname: string;
  status: string;
  createdAt: Date;
  avatarUrl: string | null;
  bio: string | null;
  lastLoginAt: Date | null;
}

export interface AuthTokenResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ---------- 注册 ----------
  async register(
    email: string,
    password: string,
    ctx: { ip?: string; userAgent?: string },
  ): Promise<AuthTokenResult> {
    const allowReg = this.config.get<boolean>('allowRegistration');
    if (allowReg === false) {
      await this.writeAudit({
        action: 'auth.register.fail',
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: 'fail',
        errorCode: '10008',
      });
      throw new ForbiddenException({ code: 10008, message: '当前未开放注册' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const nickname = normalizedEmail.split('@')[0] || '用户';

    // 并发安全：依赖 users.email 唯一索引，重复注册走 catch
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const accessTtlMs = parseTtl(this.config.get<string>('jwtAccessTtl') ?? '2h');
    const refreshTtlMs = parseTtl(this.config.get<string>('jwtRefreshTtl') ?? '24h');

    const userId = `user_${nanoid()}`;
    const jti = `at_${nanoid()}`;
    const refreshToken = nanoid(32);
    const refreshTokenHash = this.sha256(refreshToken);
    const now = new Date();
    const refreshExpiresAt = new Date(now.getTime() + refreshTtlMs);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: userId,
            email: normalizedEmail,
            passwordHash,
            nickname,
            status: 'active',
            lastLoginAt: now,
          },
        });
        await tx.refreshToken.create({
          data: {
            id: `rt_${nanoid()}`,
            userId,
            tokenHash: refreshTokenHash,
            userAgent: ctx.userAgent,
            ip: ctx.ip,
            expiresAt: refreshExpiresAt,
          },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        // 唯一索引冲突，说明邮箱已注册
        await this.writeAudit({
          action: 'auth.register.fail',
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          result: 'fail',
          errorCode: '10002',
        });
        throw new ConflictException({ code: 10002, message: '该邮箱已注册，可直接登录' });
      }
      throw e;
    }

    const accessToken = await this.signAccessToken(userId, jti, accessTtlMs);

    await this.writeAudit({
      action: 'auth.register.success',
      userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      result: 'success',
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new InternalServerErrorException('user not found after register');
    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  // ---------- 登录 ----------
  async login(
    email: string,
    password: string,
    ctx: { ip?: string; userAgent?: string },
  ): Promise<AuthTokenResult> {
    const normalizedEmail = email.trim().toLowerCase();

    const accessTtlMs = parseTtl(this.config.get<string>('jwtAccessTtl') ?? '2h');
    const refreshTtlMs = parseTtl(this.config.get<string>('jwtRefreshTtl') ?? '24h');

    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    // 常量时间：无论用户是否存在都走一次 argon2.verify 的"等代价"路径：
    // 用一个固定假哈希执行 verify，避免 timing 枚举账号。
    const dummyHash =
      '$argon2id$v=19$m=65536,t=3,p=1$YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY$' +
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    let passwordOk = false;
    if (user) {
      passwordOk = await argon2.verify(user.passwordHash, password).catch(() => false);
    } else {
      await argon2.verify(dummyHash, password).catch(() => false);
    }

    if (!user || !passwordOk) {
      await this.writeAudit({
        action: 'auth.login.fail',
        userId: user?.id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: 'fail',
        errorCode: '10001',
      });
      throw new UnauthorizedException({ code: 10001, message: '邮箱或密码错误' });
    }

    if (user.status !== 'active') {
      await this.writeAudit({
        action: 'auth.login.fail',
        userId: user.id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: 'fail',
        errorCode: '10003',
      });
      throw new ForbiddenException({ code: 10003, message: '账号不可用' });
    }

    const now = new Date();
    const jti = `at_${nanoid()}`;
    const accessToken = await this.signAccessToken(user.id, jti, accessTtlMs);
    const refreshToken = nanoid(32);
    const refreshTokenHash = this.sha256(refreshToken);
    const refreshExpiresAt = new Date(now.getTime() + refreshTtlMs);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: now },
      }),
      this.prisma.refreshToken.create({
        data: {
          id: `rt_${nanoid()}`,
          userId: user.id,
          tokenHash: refreshTokenHash,
          userAgent: ctx.userAgent,
          ip: ctx.ip,
          expiresAt: refreshExpiresAt,
        },
      }),
    ]);

    await this.writeAudit({
      action: 'auth.login.success',
      userId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      result: 'success',
    });

    const updated = await this.prisma.user.findUnique({ where: { id: user.id } });
    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(updated ?? user),
    };
  }

  // ---------- 退出 ----------
  async logout(params: {
    userId: string;
    jti: string;
    refreshToken?: string;
    expAtMs?: number;
    ip?: string;
    userAgent?: string;
  }) {
    const { userId, jti, refreshToken, expAtMs } = params;
    // 1) access jti 进黑名单
    if (jti) {
      const ttl = expAtMs ? expAtMs - Date.now() : 2 * 3600 * 1000;
      tokenBlacklist.add(jti, Date.now() + Math.max(ttl, 0));
    }
    // 2) 吊销对应 refresh_token
    if (refreshToken) {
      const hash = this.sha256(refreshToken);
      const rt = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
      if (rt && rt.userId === userId && !rt.revokedAt) {
        await this.prisma.refreshToken.update({
          where: { id: rt.id },
          data: { revokedAt: new Date() },
        });
      }
    }
    await this.writeAudit({
      action: 'auth.logout.success',
      userId,
      ip: params.ip,
      userAgent: params.userAgent,
      result: 'success',
    });
    return { success: true };
  }

  // ---------- 刷新 ----------
  async refresh(
    refreshToken: string,
    ctx: { ip?: string; userAgent?: string },
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
    if (!refreshToken) {
      throw new UnauthorizedException({ code: 10006, message: '登录状态无效，请重新登录' });
    }
    const accessTtlMs = parseTtl(this.config.get<string>('jwtAccessTtl') ?? '2h');
    const refreshTtlMs = parseTtl(this.config.get<string>('jwtRefreshTtl') ?? '24h');

    const hash = this.sha256(refreshToken);
    const rt = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: { user: true },
    });

    const now = new Date();
    const invalid = () =>
      new UnauthorizedException({ code: 10006, message: '登录状态无效，请重新登录' });

    if (!rt) throw invalid();
    if (rt.expiresAt.getTime() <= now.getTime()) {
      // 过期视为无效
      await this.prisma.refreshToken.update({
        where: { id: rt.id },
        data: { revokedAt: rt.revokedAt ?? now },
      }).catch(() => null);
      throw invalid();
    }
    if (rt.revokedAt) {
      // 重用检测：强制该用户所有 refresh 全部吊销
      await this.revokeAllForUser(rt.userId);
      await this.writeAudit({
        action: 'auth.refresh.reuse_detected',
        userId: rt.userId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: 'fail',
        errorCode: '10006',
      });
      throw invalid();
    }
    if (rt.user.status !== 'active') {
      throw new ForbiddenException({ code: 10003, message: '账号不可用' });
    }

    // rotation：吊销旧 token，签发新 token
    const newRefreshToken = nanoid(32);
    const newRefreshHash = this.sha256(newRefreshToken);
    const newExpiresAt = new Date(now.getTime() + refreshTtlMs);
    const jti = `at_${nanoid()}`;
    const accessToken = await this.signAccessToken(rt.userId, jti, accessTtlMs);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: rt.id },
        data: { revokedAt: now },
      }),
      this.prisma.refreshToken.create({
        data: {
          id: `rt_${nanoid()}`,
          userId: rt.userId,
          tokenHash: newRefreshHash,
          userAgent: ctx.userAgent,
          ip: ctx.ip,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    await this.writeAudit({
      action: 'auth.refresh.success',
      userId: rt.userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      result: 'success',
    });

    return { accessToken, refreshToken: newRefreshToken, user: this.sanitizeUser(rt.user) };
  }

  async getMe(userId: string): Promise<AuthUser> {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new UnauthorizedException({ code: 10006, message: '用户不存在' });
    return this.sanitizeUser(u);
  }

  // ---------- 内部 ----------
  private async signAccessToken(userId: string, jti: string, ttlMs: number): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + Math.floor(ttlMs / 1000);
    return this.jwt.signAsync(
      { sub: userId, jti, iat, exp },
      {
        secret: this.config.get<string>('jwtSecret'),
        
      },
    );
  }

  private sha256(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sanitizeUser(u: any): AuthUser {
    return {
      id: u.id,
      email: u.email,
      nickname: u.nickname,
      status: u.status,
      createdAt: u.createdAt,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      lastLoginAt: u.lastLoginAt,
    };
  }

  private async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async writeAudit(a: {
    action: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    result: 'success' | 'fail';
    errorCode?: string;
    detail?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: `al_${nanoid()}`,
          action: a.action,
          userId: a.userId,
          ip: a.ip,
          userAgent: a.userAgent,
          result: a.result,
          errorCode: a.errorCode,
          detail: a.detail,
        },
      });
    } catch (e) {
      // 审计失败不应阻断主流程
      // eslint-disable-next-line no-console
      console.warn('audit write failed', e);
    }
  }
}
