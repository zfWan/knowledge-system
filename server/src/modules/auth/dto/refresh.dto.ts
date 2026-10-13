import { IsString, Length } from 'class-validator';

export class RefreshDto {
  @IsString()
  @Length(16, 128)
  refreshToken!: string;
}
