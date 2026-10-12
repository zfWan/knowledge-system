import {
  Body,
  Controller,
  HttpCode,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { AuthThrottleGuard, ThrottleScope } from '../../common/throttler/auth-throttle.guard';

@Controller('auth')
@UseGuards(AuthThrottleGuard)
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('register')
  @ThrottleScope('register')
  async register(@Body() dto: RegisterDto, @Req() req: any, @Ip() ip: string) {
    return this.service.register(dto.email, dto.password, {
      ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ThrottleScope('login')
  async login(@Body() dto: LoginDto, @Req() req: any, @Ip() ip: string) {
    return this.service.login(dto.email, dto.password, {
      ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Post('logout')
  @ThrottleScope('logout')
  async logout(
    @Body() dto: LogoutDto,
    @CurrentUser() user: { userId: string; jti: string },
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const exp = req.user?.exp as number | undefined;
    return this.service.logout({
      userId: user.userId,
      jti: user.jti,
      refreshToken: dto.refreshToken,
      expAtMs: exp ? exp * 1000 : undefined,
      ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ThrottleScope('refresh')
  async refresh(@Body() dto: RefreshDto, @Req() req: any, @Ip() ip: string) {
    return this.service.refresh(dto.refreshToken, {
      ip,
      userAgent: req.headers?.['user-agent'],
    });
  }
}
