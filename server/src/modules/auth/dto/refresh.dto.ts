import { IsString, Length } from 'class-validator';

export class RefreshDto {
  @IsString()
  @Length(10, 200, { message: 'refreshToken 无效' })
  refreshToken!: string;
}
