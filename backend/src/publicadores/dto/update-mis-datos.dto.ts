import { IsDateString, IsEmail, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const ESTADO_CIVIL_VALUES = ['Casado', 'Soltero', 'Divorciado', 'Separado', 'Viudo'] as const;
const PRIVILEGIO_MIN_VALUES = ['Ninguno', 'Anciano', 'Siervo ministerial'] as const;
const PRIVILEGIO_SER_VALUES = [
  'Publicador',
  'Precursor regular',
  'Precursor especial',
  'Misionero que sirve en el campo',
  'Miembro de la familia Betel',
] as const;
const PARTICIPO_ANTES_VALUES = ['SI', 'NO'] as const;

/** Mismos campos y validaciones que "Editar solicitud" (backend/src/publicadores/dto/
 * update-publicador.dto.ts), pero SIN los campos de flujo administrativo (estado,
 * entrenamiento_requerido, fecha_solicitud, existe_bd_anterior, fechas/lugares de
 * capacitación, etc.): un participante nunca debe poder tocar esos desde este
 * formulario. Todo opcional, igual que en modo edición del formulario de admin. */
export class UpdateMisDatosDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  primer_apellido?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  segundo_apellido?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  primer_nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  segundo_nombre?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(6)
  codigo_departamento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(6)
  codigo_municipio?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  correo_electronico?: string;

  @IsOptional()
  @Matches(/^\d{1,10}$/, { message: 'movil debe contener solo números (máx. 10 dígitos)' })
  movil?: string;

  @IsOptional()
  @IsInt()
  codigo_congregacion?: number;

  @IsOptional()
  @IsDateString()
  fecha_nacimiento?: string;

  @IsOptional()
  @IsIn(['M', 'F'])
  sexo?: 'M' | 'F';

  @IsOptional()
  @IsDateString()
  fecha_bautismo?: string;

  @IsOptional()
  @IsIn(ESTADO_CIVIL_VALUES)
  estado_civil?: (typeof ESTADO_CIVIL_VALUES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre_conyuge?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  apellido_casada?: string | null;

  @IsOptional()
  @IsIn(PRIVILEGIO_MIN_VALUES)
  privilegio_min?: (typeof PRIVILEGIO_MIN_VALUES)[number];

  @IsOptional()
  @IsIn(PRIVILEGIO_SER_VALUES)
  privilegio_ser?: (typeof PRIVILEGIO_SER_VALUES)[number];

  @IsOptional()
  @IsIn(PARTICIPO_ANTES_VALUES)
  participo_antes?: (typeof PARTICIPO_ANTES_VALUES)[number];
}
