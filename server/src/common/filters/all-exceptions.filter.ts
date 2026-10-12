import {
  ArgumentsHost,
  BadRequestException,
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
        if (r.code) code = r.code;
        if (r.data !== undefined) data = r.data;
        if (typeof r.message === 'string') {
          message = r.message;
        } else if (Array.isArray(r.message)) {
          // class-validator 的字段错误
          const fieldErrors = this.flattenValidationErrors(r.message);
          if (fieldErrors.length) {
            data = { ...(data ?? {}), fieldErrors };
            message = fieldErrors.map((f) => `${f.field}: ${f.message}`).join('; ');
          } else {
            message = r.message.join('; ');
          }
          if (code === 90000) code = 90002;
        } else {
          message = exception.message;
        }

        // 若未在异常中设置 code，则按 status 推断默认
        if (!r.code) {
          if (status === HttpStatus.UNAUTHORIZED) code = 10005;
          else if (status === HttpStatus.FORBIDDEN) code = 10006;
          else if (status === HttpStatus.TOO_MANY_REQUESTS) code = 90001;
          else if (status === HttpStatus.BAD_REQUEST) {
            // 密码复杂度特殊码：通过 message 判定
            if (typeof r.message === 'string' && /包含字母和数字|密码长度/.test(r.message)) {
              code = 10007;
            } else {
              code = 90002;
            }
          } else if (status === HttpStatus.CONFLICT) code = 10002;
        }
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

  private flattenValidationErrors(raw: any[]): Array<{ field: string; message: string }> {
    const out: Array<{ field: string; message: string }> = [];
    const walk = (obj: any, prefix = '') => {
      if (typeof obj === 'string') {
        out.push({ field: prefix || '_', message: obj });
        return;
      }
      if (Array.isArray(obj)) {
        obj.forEach((v) => walk(v, prefix));
        return;
      }
      if (obj && typeof obj === 'object') {
        // class-validator ValidationError 形态：{ property, constraints, children }
        const property = obj.property;
        const key = prefix ? `${prefix}.${property}` : property || prefix;
        if (obj.constraints && typeof obj.constraints === 'object') {
          for (const k of Object.keys(obj.constraints)) {
            out.push({ field: key || '_', message: obj.constraints[k] });
          }
        }
        if (Array.isArray(obj.children) && obj.children.length) {
          obj.children.forEach((c: any) => walk(c, key));
        }
        if (!property && !obj.constraints && Array.isArray(obj.message)) {
          obj.message.forEach((m: any) => walk(m, prefix));
        }
      }
    };
    raw.forEach((v) => walk(v, ''));
    return out;
  }
}
