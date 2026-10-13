import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,64}$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;

export class RegisterDto {
  @IsIn(['email', 'phone'])
  type!: 'email' | 'phone';

  @ValidateIf((o: RegisterDto) => o.type === 'email')
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @MaxLength(100)
  email?: string;

  @ValidateIf((o: RegisterDto) => o.type === 'phone')
  @Matches(PHONE_REGEX, { message: '请输入有效的 11 位手机号' })
  phone?: string;

  @ValidateIf((o: RegisterDto) => o.type === 'phone')
  @IsString()
  @Length(6, 6, { message: '请输入 6 位验证码' })
  smsCode?: string;

  @IsString({ message: '请输入密码' })
  @MinLength(8, { message: '密码至少 8 位，且包含字母和数字' })
  @MaxLength(64, { message: '密码最长 64 位' })
  @Matches(PASSWORD_REGEX, { message: '密码至少 8 位，且包含字母和数字' })
  password!: string;

  @ValidateIf((o: RegisterDto) => o.type === 'email')
  @IsString({ message: '请再次输入密码' })
  confirmPassword?: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
