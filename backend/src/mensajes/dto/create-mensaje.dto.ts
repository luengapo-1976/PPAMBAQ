import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateMensajeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tipo!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  mensaje!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  adjunto_asociado?: string | null;
}
