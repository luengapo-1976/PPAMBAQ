import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

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
const EXISTE_BD_ANTERIOR_VALUES = ['SI', 'NO'] as const;
export const ESTADO_VALUES = [
  'REGISTRADO',
  'NOTIFICADO PRIMER ENTRENAMIENTO',
  'NOTIFICADO SEGUNDO ENTRENAMIENTO',
  'CUMPLE REQUISITOS',
] as const;
const ENTRENAMIENTO_REQUERIDO_VALUES = [
  'Primer entrenamiento',
  'Segundo entrenamiento',
  'Entrenamiento completado',
] as const;

export class CreatePublicadorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  primer_apellido!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  segundo_apellido?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  primer_nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  segundo_nombre?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  direccion!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  codigo_departamento!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  codigo_municipio!: string;

  @IsEmail()
  @MaxLength(100)
  correo_electronico!: string;

  @Matches(/^\d{1,10}$/, { message: 'movil debe contener solo números (máx. 10 dígitos)' })
  movil!: string;

  @IsInt()
  codigo_congregacion!: number;

  @IsDateString()
  fecha_nacimiento!: string;

  @IsIn(['M', 'F'])
  sexo!: 'M' | 'F';

  @IsDateString()
  fecha_bautismo!: string;

  @IsIn(ESTADO_CIVIL_VALUES)
  estado_civil!: (typeof ESTADO_CIVIL_VALUES)[number];

  @ValidateIf((o) => o.sexo === 'F' && ['Casado', 'Separado'].includes(o.estado_civil))
  @IsString()
  @IsNotEmpty({ message: 'nombre_conyuge es obligatorio para mujeres casadas o separadas' })
  @MaxLength(100)
  nombre_conyuge?: string;

  @ValidateIf((o) => o.sexo === 'F' && ['Casado', 'Separado'].includes(o.estado_civil))
  @IsString()
  @IsNotEmpty({ message: 'apellido_casada es obligatorio para mujeres casadas o separadas' })
  @MaxLength(20)
  apellido_casada?: string;

  @IsIn(PRIVILEGIO_MIN_VALUES)
  privilegio_min!: (typeof PRIVILEGIO_MIN_VALUES)[number];

  @IsIn(PRIVILEGIO_SER_VALUES)
  privilegio_ser!: (typeof PRIVILEGIO_SER_VALUES)[number];

  @IsIn(PARTICIPO_ANTES_VALUES)
  participo_antes!: (typeof PARTICIPO_ANTES_VALUES)[number];

  @IsDateString()
  fecha_solicitud!: string;

  @IsIn(ESTADO_VALUES)
  estado!: (typeof ESTADO_VALUES)[number];

  @IsIn(ENTRENAMIENTO_REQUERIDO_VALUES)
  entrenamiento_requerido!: (typeof ENTRENAMIENTO_REQUERIDO_VALUES)[number];

  @IsOptional()
  @IsDateString()
  fecha_aprobacion?: string | null;

  @IsOptional()
  @IsDateString()
  fecha_cumple_requisitos?: string | null;

  @IsOptional()
  @IsIn(EXISTE_BD_ANTERIOR_VALUES)
  existe_bd_anterior?: (typeof EXISTE_BD_ANTERIOR_VALUES)[number];
}
