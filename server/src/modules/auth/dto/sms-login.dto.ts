import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

const PHONE_REGEX = /^1[3-9]\d{9}$/;

export class SmsLoginDto {
  @Matches(PHONE_REGEX, { message: '请输入有效的 11 位手机号' })
  phone!: string;

  @IsString()
  @Length(6, 6, { message: '请输入 6 位验证码' })
  smsCode!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
