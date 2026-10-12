import { IsOptional, IsString, Length } from 'class-validator';

export class LogoutDto {
  @IsOptional()
  @IsString()
  @Length(10, 200)
  refreshToken?: string;
}
