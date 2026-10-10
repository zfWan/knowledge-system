import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const requestId = req.requestId;
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'ok',
        data: data ?? null,
        requestId,
      })),
    );
  }
}
