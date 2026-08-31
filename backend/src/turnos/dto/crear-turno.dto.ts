import { IsIn, IsInt, IsString, Matches } from 'class-validator';

const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

const HORA_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;

export class CrearTurnoDto {
  @IsInt()
  codigo_punto!: number;

  @IsIn(DIAS_SEMANA)
  dia_nombre!: (typeof DIAS_SEMANA)[number];

  @IsString()
  @Matches(HORA_REGEX, { message: 'hora_inicio debe tener formato HH:MM' })
  hora_inicio!: string;

  @IsString()
  @Matches(HORA_REGEX, { message: 'hora_fin debe tener formato HH:MM' })
  hora_fin!: string;
}
