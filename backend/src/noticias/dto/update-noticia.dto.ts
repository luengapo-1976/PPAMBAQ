import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const ESTADOS = ['BORRADOR', 'PUBLICADA'] as const;

export class UpdateNoticiaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(200)
  titulo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El resumen es obligatorio.' })
  @MaxLength(300)
  resumen?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El contenido es obligatorio.' })
  contenido?: string;

  @IsOptional()
  @IsString()
  imagen_url?: string | null;

  @IsOptional()
  @IsString()
  storage_path?: string | null;

  @IsOptional()
  @IsIn(ESTADOS)
  estado?: (typeof ESTADOS)[number];

  @IsOptional()
  @IsString()
  fecha_maxima_publicacion?: string | null;
}
