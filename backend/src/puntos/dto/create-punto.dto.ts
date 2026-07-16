import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const ESTADO_VALUES = ['Activo', 'Inactivo'] as const;

export class CreatePuntoDto {
  @IsInt()
  codigo_punto!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_punto!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  direccion?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  encargado?: string | null;

  @IsOptional()
  @Matches(/^\d{1,10}$/, { message: 'movil debe contener solo números (máx. 10 dígitos)' })
  movil?: string | null;

  @IsOptional()
  @IsIn(ESTADO_VALUES)
  estado?: (typeof ESTADO_VALUES)[number];
}
