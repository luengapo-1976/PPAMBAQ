import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SolicitarTurnoDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  justificacion?: string;

  /** Solo la usa el flujo administrativo ("Asignar turno"): permite asignar el turno
   * a un publicador distinto de quien hace la petición. Si no viene, se usa el
   * publicador del usuario logueado (flujo normal de participante). */
  @IsOptional()
  @IsString()
  id_publicador?: string;
}
