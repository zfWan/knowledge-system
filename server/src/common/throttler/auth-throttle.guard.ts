import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { authThrottler } from './sliding-window.throttler';

/**
 * 认证接口限流守卫：
 * - /auth/login、/auth/register：按 IP + email 双维度
 * - /auth/refresh：按 IP
 * - /auth/logout：按 userId
 * 命中任意维度即 429/90001。
 *
 * 通过 @ThrottleScope(scope) 声明 handler 的限流维度。
 */

export type AuthThrottleScope = 'login' | 'register' | 'refresh' | 'logout';
export const AUTH_THROTTLE_SCOPE_KEY = 'authThrottleScope';
export const ThrottleScope = (scope: AuthThrottleScope) =>
  SetMetadata(AUTH_THROTTLE_SCOPE_KEY, scope);

@Injectable()
export class AuthThrottleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const scope = this.reflector.getAllAndOverride<AuthThrottleScope>(AUTH_THROTTLE_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!scope) return true;

    const req = context.switchToHttp().getRequest();
    const ip = this.getIp(req);
    const windowMs = (this.config.get<number>('authThrottleTtl') ?? 60) * 1000;
    const limit = this.config.get<number>('authThrottleLimit') ?? 5;

    const keys: string[] = [];
    if (scope === 'login' || scope === 'register') {
      const email = String(req.body?.email ?? '')
        .trim()
        .toLowerCase();
      keys.push(`ip:${ip}`);
      if (email) keys.push(`email:${email}`);
    } else if (scope === 'refresh') {
      keys.push(`ip:${ip}`);
    } else if (scope === 'logout') {
      const userId = req.user?.userId || 'anonymous';
      keys.push(`user:${userId}`);
    }

    for (const key of keys) {
      const r = authThrottler.hit(key, windowMs, limit);
      if (!r.ok) {
        throw new HttpException(
          { code: 90001, message: '操作过于频繁，请稍后再试' },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
    return true;
  }

  private getIp(req: any): string {
    // 反代部署时：在 main.ts 启用 trust proxy 后 req.ip 会是真实客户端 IP。
    const xf = req.headers?.['x-forwarded-for'];
    if (typeof xf === 'string' && xf.length) {
      return xf.split(',')[0].trim();
    }
    return req.ip || 'unknown';
  }
}
