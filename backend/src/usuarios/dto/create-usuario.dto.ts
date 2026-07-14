import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const ROL_VALUES = ['Administrador', 'Coordinador'] as const;

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  login!: string;

  @IsIn(ROL_VALUES)
  rol!: (typeof ROL_VALUES)[number];

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  correo?: string | null;

  @IsOptional()
  @Matches(/^\d{1,10}$/, { message: 'movil debe contener solo números (máx. 10 dígitos)' })
  movil?: string | null;
}
