import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenBlacklist } from '../utils/token-blacklist';

export interface JwtPayload {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtAuthGuard {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private config: ConfigService,
    private blacklist: TokenBlacklist,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.['authorization'] as string | undefined;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 10201, message: '未登录或登录已过期' });
    }
    const token = auth.slice('Bearer '.length).trim();
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.get<string>('jwtSecret'),
      });
    } catch {
      throw new UnauthorizedException({ code: 10201, message: '登录已过期，请重新登录' });
    }

    if (this.blacklist.has(payload.jti)) {
      throw new UnauthorizedException({ code: 10201, message: '登录已过期，请重新登录' });
    }

    req.user = { userId: payload.sub, jti: payload.jti };
    return true;
  }
}
