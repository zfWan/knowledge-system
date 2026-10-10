import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { Observable } from 'rxjs';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    const requestId =
      (req.headers && (req.headers['x-request-id'] as string)) || `req_${nanoid(12)}`;
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    return next.handle();
  }
}
