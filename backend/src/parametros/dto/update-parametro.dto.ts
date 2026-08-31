import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateParametroDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  valor?: string | null;

  @IsBoolean()
  activo!: boolean;
}
