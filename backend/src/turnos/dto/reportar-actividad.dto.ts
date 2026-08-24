import { IsDateString, IsIn, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export type RespuestaSiNo = 'SI' | 'NO';

export class ReportarActividadDto {
  @IsDateString()
  fechaActividad!: string;

  @IsIn(['SI', 'NO'])
  cumplioTurno!: RespuestaSiNo;

  /** Solo se pide (y se valida) si sí se cumplió el turno; si no, queda sin
   * responder y se guarda como null. */
  @ValidateIf((dto: ReportarActividadDto) => dto.cumplioTurno === 'SI')
  @IsIn(['SI', 'NO'])
  inicioConversacion?: RespuestaSiNo;

  /** Solo se pide si además se inició una conversación. */
  @ValidateIf((dto: ReportarActividadDto) => dto.cumplioTurno === 'SI' && dto.inicioConversacion === 'SI')
  @IsIn(['SI', 'NO'])
  arreglosCurso?: RespuestaSiNo;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
