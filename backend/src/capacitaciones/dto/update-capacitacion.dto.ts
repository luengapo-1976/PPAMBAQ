import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const TIPOS = ['IMAGEN', 'VIDEO'] as const;

export class UpdateCapacitacionDto {
  @IsOptional()
  @IsIn(TIPOS, { message: 'El tipo debe ser IMAGEN o VIDEO.' })
  tipo?: (typeof TIPOS)[number];

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
  imagen_url?: string | null;

  @IsOptional()
  @IsString()
  storage_path?: string | null;

  @IsOptional()
  @IsString()
  video_url?: string | null;

  @IsOptional()
  @IsString()
  fecha_maxima_publicacion?: string | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
