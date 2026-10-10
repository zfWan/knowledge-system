import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// 骨架阶段的简化守卫：仅放行 @Public() 装饰的接口，其他接口返回 401。
// 正式 JWT 校验在后续编码节点实现（@nestjs/jwt + passport-jwt + refresh rotation）。
@Injectable()
export class JwtAuthGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.['authorization'] as string | undefined;
    if (!auth || !auth.startsWith('Bearer ')) return false;
    // TODO: verify JWT, attach req.user = { userId, ... }
    req.user = { userId: 'user_dev', nickname: 'dev-user' };
    return true;
  }
}
