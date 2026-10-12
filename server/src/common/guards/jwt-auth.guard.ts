import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { tokenBlacklist } from './token-blacklist';

export interface JwtPayload {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.['authorization'] as string | undefined;
    if (!auth || !auth.startsWith('Bearer ')) {
      if (isPublic) return true;
      throw new HttpException(
        { code: 10005, message: '登录已过期，请重新登录' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = auth.slice('Bearer '.length).trim();
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('jwtSecret'),
      });
    } catch (e: any) {
      if (isPublic) return true;
      const name = e?.name || '';
      if (name === 'TokenExpiredError') {
        throw new HttpException(
          { code: 10005, message: '登录已过期，请重新登录' },
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new HttpException(
        { code: 10006, message: '登录状态无效，请重新登录' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!payload || !payload.sub || !payload.jti) {
      if (isPublic) return true;
      throw new HttpException(
        { code: 10006, message: '登录状态无效，请重新登录' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (tokenBlacklist.has(payload.jti)) {
      if (isPublic) return true;
      throw new HttpException(
        { code: 10006, message: '登录状态无效，请重新登录' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    req.user = { userId: payload.sub, jti: payload.jti };
    return true;
  }
}
