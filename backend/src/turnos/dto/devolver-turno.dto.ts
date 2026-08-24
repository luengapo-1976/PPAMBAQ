import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export const MOTIVOS_DEVOLUCION = [
  'Ocupado (mis circunstancias han cambiado)',
  'Salud (enfermedad, cirugía, etc.)',
  'Temporal (asignación, viaje, etc.)',
  'Traslado (me mudé)',
  'Cambio de Punto',
  'Otro',
] as const;

export type MotivoDevolucion = (typeof MOTIVOS_DEVOLUCION)[number];

export class DevolverTurnoDto {
  @IsIn(MOTIVOS_DEVOLUCION)
  motivo!: MotivoDevolucion;

  @ValidateIf((dto: DevolverTurnoDto) => dto.motivo === 'Otro')
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  motivoOtro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
