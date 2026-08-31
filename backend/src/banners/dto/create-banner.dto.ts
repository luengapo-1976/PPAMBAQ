import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @IsNotEmpty({ message: 'La URL de la imagen es obligatoria.' })
  imagen_url!: string;

  @IsString()
  @IsNotEmpty({ message: 'La ruta de almacenamiento es obligatoria.' })
  storage_path!: string;

  @IsInt()
  @Min(1)
  ancho_px!: number;

  @IsInt()
  @Min(1)
  alto_px!: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
