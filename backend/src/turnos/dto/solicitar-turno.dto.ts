import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SolicitarTurnoDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  justificacion?: string;
}
