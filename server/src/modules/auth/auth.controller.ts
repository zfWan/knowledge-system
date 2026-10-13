import {
  Body,
  Controller,
  Headers,
  Ip,
  Post,
  Req,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SmsLoginDto } from './dto/sms-login.dto';
import { SmsSendDto } from './dto/sms-send.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') ua?: string,
  ) {
    return this.service.register(dto, ip, ua);
  }

  @Public()
  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') ua?: string,
  ) {
    return this.service.login(dto, ip, ua);
  }

  @Public()
  @Post('login/sms')
  loginBySms(
    @Body() dto: SmsLoginDto,
    @Ip() ip: string,
    @Headers('user-agent') ua?: string,
  ) {
    return this.service.loginBySms(dto, ip, ua);
  }

  @Public()
  @Post('sms/send')
  sendSms(@Body() dto: SmsSendDto) {
    return this.service.sendSms(dto);
  }

  @Public()
  @Post('refresh')
  refresh(
    @Body() dto: RefreshDto,
    @Ip() ip: string,
    @Headers('user-agent') ua?: string,
  ) {
    return this.service.refresh(dto, ip, ua);
  }

  @Post('logout')
  logout(
    @Req() req: any,
    @CurrentUser() user: { userId: string; jti: string },
    @Body() dto: LogoutDto,
    @Headers('authorization') auth?: string,
  ) {
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
    return this.service.logout(user.userId, user.jti, token, dto);
  }
}
