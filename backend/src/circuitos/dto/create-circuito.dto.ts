import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCircuitoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  codigo_circuito!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_viajante!: string;

  @IsNotEmpty()
  @Matches(/^\d{1,10}$/, { message: 'movil debe contener solo números (máx. 10 dígitos)' })
  movil!: string;

  @IsEmail()
  @MaxLength(100)
  correo_electronico!: string;
}
