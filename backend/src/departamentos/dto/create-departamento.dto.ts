import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDepartamentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  codigo_departamento!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_departamento!: string;
}
