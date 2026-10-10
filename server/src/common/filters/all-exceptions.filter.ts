import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { logger } from '../logger/logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 90000;
    let message = '系统内部错误';
    let data: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (typeof resp === 'object' && resp !== null) {
        const r = resp as any;
        message = r.message || exception.message;
        if (Array.isArray(message)) message = message.join('; ');
        if (r.code) code = r.code;
        if (r.data !== undefined) data = r.data;
        if (status === HttpStatus.UNAUTHORIZED) code = code === 90000 ? 10005 : code;
        if (status === HttpStatus.FORBIDDEN) code = code === 90000 ? 10006 : code;
        if (status === HttpStatus.TOO_MANY_REQUESTS) code = code === 90000 ? 90001 : code;
        if (status === HttpStatus.BAD_REQUEST && code === 90000) code = 90002;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      logger.error(
        { err: exception, requestId: req.requestId, path: req.url },
        'unhandled exception',
      );
    }

    res.status(status).json({
      code,
      message: status === 500 && process.env.NODE_ENV === 'production' ? '系统内部错误' : message,
      data,
      requestId: req.requestId,
    });
  }
}
