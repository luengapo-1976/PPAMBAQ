import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateMunicipioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_municipio!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  codigo_departamento!: string;
}
