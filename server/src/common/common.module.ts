import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenBlacklist } from './utils/token-blacklist';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwtSecret'),
        signOptions: { expiresIn: '2h' },
      }),
      global: true,
    }),
  ],
  providers: [TokenBlacklist],
  exports: [JwtModule, TokenBlacklist],
})
export class CommonModule {}
