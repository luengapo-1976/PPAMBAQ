import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateBannerDto {
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
