import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email!: string;

  @IsString()
  @Length(8, 64, { message: '密码长度需在 8-64 位之间' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[\s\S]{8,64}$/, {
    message: '密码需至少 8 位，且包含字母和数字',
  })
  password!: string;
}
