import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const ESTADO_VALUES = ['Activo', 'Inactivo'] as const;
const TIPO_PUNTO_VALUES = ['Punto PPAM', 'Punto de entrenamiento'] as const;

export class CreatePuntoDto {
  @IsInt()
  codigo_punto!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_punto!: string;

  @IsIn(TIPO_PUNTO_VALUES)
  tipo_punto!: (typeof TIPO_PUNTO_VALUES)[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  direccion!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  codigo_departamento!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  codigo_municipio!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  encargado!: string;

  @IsNotEmpty()
  @Matches(/^\d{1,10}$/, { message: 'movil debe contener solo números (máx. 10 dígitos)' })
  movil!: string;

  @IsOptional()
  @IsIn(ESTADO_VALUES)
  estado?: (typeof ESTADO_VALUES)[number];
}
