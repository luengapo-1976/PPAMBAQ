import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCircuitoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  codigo_circuito!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre_viajante?: string | null;

  @IsOptional()
  @Matches(/^\d{1,10}$/, { message: 'movil debe contener solo números (máx. 10 dígitos)' })
  movil?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  correo_electronico?: string | null;
}
