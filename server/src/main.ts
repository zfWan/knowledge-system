import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { logger } from './common/logger/logger';

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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalInterceptors(new RequestIdInterceptor(), new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger (仅在非 production 默认开启，可通过 ENABLE_SWAGGER 关闭)
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
