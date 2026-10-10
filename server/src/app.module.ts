import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { configuration } from './common/config/configuration';
import { PrismaModule } from './common/prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { NoteModule } from './modules/note/note.module';
import { CategoryModule } from './modules/category/category.module';
import { TagModule } from './modules/tag/tag.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { StorageModule } from './modules/storage/storage.module';
import { SearchModule } from './modules/search/search.module';
import { IndexModule } from './modules/index/index.module';
import { LlmModule } from './modules/llm/llm.module';
import { EmbeddingModule } from './modules/embedding/embedding.module';
import { RerankModule } from './modules/rerank/rerank.module';
import { ChatModule } from './modules/chat/chat.module';
import { QuotaModule } from './modules/quota/quota.module';
import { AuditModule } from './modules/audit/audit.module';
import { QueueModule } from './modules/queue/queue.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UserModule,
    NoteModule,
    CategoryModule,
    TagModule,
    AttachmentModule,
    StorageModule,
    SearchModule,
    IndexModule,
    LlmModule,
    EmbeddingModule,
    RerankModule,
    ChatModule,
    QuotaModule,
    AuditModule,
    QueueModule,
    MailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
