import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async check() {
    let db: 'ok' | 'fail' = 'fail';
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      db = 'ok';
    } catch {
      db = 'fail';
    }
    return {
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      llmConfigured: Boolean(this.config.get('llmApiKey')),
      version: '0.1.0',
    };
  }
}
