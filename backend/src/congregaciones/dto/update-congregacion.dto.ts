import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateCongregacionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_congregacion!: string;

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
  @MaxLength(10)
  codigo_circuito!: string;

  @IsEmail()
  @MaxLength(100)
  correo_congregacion!: string;
}
