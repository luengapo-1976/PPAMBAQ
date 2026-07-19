import { IsEmail, IsIn, IsNotEmpty, IsOptional, Matches, MaxLength, MinLength } from 'class-validator';
import { ROL_VALUES } from './create-usuario.dto';

export class UpdateUsuarioDto {
  @IsIn(ROL_VALUES)
  rol!: (typeof ROL_VALUES)[number];

  /** Opcional: si se deja en blanco, el servicio conserva la contraseña actual. */
  @IsOptional()
  @MinLength(6)
  @MaxLength(100)
  password?: string;

  @IsEmail()
  @MaxLength(100)
  correo!: string;

  @IsNotEmpty()
  @Matches(/^\d{1,10}$/, { message: 'movil debe contener solo números (máx. 10 dígitos)' })
  movil!: string;
}
