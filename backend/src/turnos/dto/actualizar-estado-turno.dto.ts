import { IsIn } from 'class-validator';

const ESTADOS = ['ACTIVO', 'INACTIVO'] as const;

export class ActualizarEstadoTurnoDto {
  @IsIn(ESTADOS)
  estado_turno!: (typeof ESTADOS)[number];
}
