import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const CATEGORIA_VALUES = ['ENTRENAMIENTO', 'RESPUESTA CASOS'] as const;

export class CreateMensajeDto {
  @IsIn(CATEGORIA_VALUES)
  categoria!: (typeof CATEGORIA_VALUES)[number];

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
