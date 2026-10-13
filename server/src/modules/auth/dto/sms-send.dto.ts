import { IsIn, Matches } from 'class-validator';

const PHONE_REGEX = /^1[3-9]\d{9}$/;

export class SmsSendDto {
  @Matches(PHONE_REGEX, { message: '请输入有效的 11 位手机号' })
  phone!: string;

  @IsIn(['register', 'login'])
  scene!: 'register' | 'login';
}
