import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateDepartamentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_departamento!: string;
}
