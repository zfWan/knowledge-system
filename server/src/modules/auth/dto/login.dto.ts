import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,64}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;

export class LoginDto {
  @IsString({ message: '请输入账号' })
  @MaxLength(100)
  account!: string; // 邮箱或手机号

  @IsString({ message: '请输入密码' })
  @MinLength(8)
  @MaxLength(64)
  @Matches(PASSWORD_REGEX, { message: '账号或密码错误' })
  password!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export const isEmail = (s: string) => EMAIL_REGEX.test(s);
export const isPhone = (s: string) => PHONE_REGEX.test(s);
