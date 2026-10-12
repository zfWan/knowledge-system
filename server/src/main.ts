import { NestFactory } from '@nestjs/core';
import { BadRequestException, HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { logger } from './common/logger/logger';

function buildValidationException(errors: any[]) {
  // 若包含密码复杂度类错误，返回 10007，否则返回 90002
  const flatten: Array<{ field: string; message: string }> = [];
  const walk = (obj: any, prefix = '') => {
    if (!obj) return;
    if (obj.constraints && typeof obj.constraints === 'object') {
      const property = obj.property || prefix;
      const key = prefix ? `${prefix}.${property}` : property;
      for (const k of Object.keys(obj.constraints)) {
        flatten.push({ field: key || '_', message: obj.constraints[k] });
      }
    }
    if (Array.isArray(obj.children)) obj.children.forEach((c: any) => walk(c, obj.property ? (prefix ? `${prefix}.${obj.property}` : obj.property) : prefix));
  };
  errors.forEach((e) => walk(e, ''));
  const hasPasswordComplexity = flatten.some(
    (f) => f.field === 'password' && /字母和数字|密码长度/.test(f.message),
  );
  const code = hasPasswordComplexity ? 10007 : 90002;
  const message = hasPasswordComplexity
    ? '密码需至少 8 位，且包含字母和数字'
    : flatten.map((f) => `${f.field}: ${f.message}`).join('; ') || '参数校验失败';
  return new BadRequestException({ code, message, data: { fieldErrors: flatten } });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: false,
  });

  const config = app.get(ConfigService);
  const port = parseInt(config.get<string>('PORT', '3000'), 10);
  const corsOrigins = config
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: corsOrigins.length ? corsOrigins : true, credentials: true });

  // 反代部署时如需从 X-Forwarded-For 取真实 IP，可取消下一行注释：
  // app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      validationError: { target: false, value: false },
      exceptionFactory: buildValidationException,
    }),
  );
  app.useGlobalInterceptors(new RequestIdInterceptor(), new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  if (config.get<string>('NODE_ENV') !== 'production' || config.get('ENABLE_SWAGGER') === 'true') {
    const swagger = new DocumentBuilder()
      .setTitle('个人知识库 API')
      .setDescription('Knowledge System V1.0 API（REST + SSE）')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);
  logger.info(`server listening on http://localhost:${port}/api`);
}
bootstrap();
