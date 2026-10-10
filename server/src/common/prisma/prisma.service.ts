import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { logger } from '../logger/logger';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private config: ConfigService) {
    super({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    // 启用外键 + WAL 等 pragma。
    // 注意：PRAGMA journal_mode 会返回一行结果（当前模式名），必须走 $queryRawUnsafe。
    try {
      await this.$executeRawUnsafe('PRAGMA foreign_keys=ON;');
      await this.$executeRawUnsafe('PRAGMA synchronous=NORMAL;');
      if (this.config.get<boolean>('sqliteWal')) {
        const rows: any = await this.$queryRawUnsafe('PRAGMA journal_mode=WAL;');
        const mode = Array.isArray(rows) && rows[0]?.journal_mode;
        if (mode && mode !== 'wal') {
          logger.warn({ journalMode: mode }, 'sqlite WAL mode not active');
        }
      }
    } catch (e) {
      logger.warn({ err: e }, 'failed to set sqlite pragmas (may be unsupported by environment)');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
