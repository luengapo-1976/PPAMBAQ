import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SolicitarBajaDto {
  @IsString()
  @IsNotEmpty({ message: 'Debes indicar una justificación.' })
  @MaxLength(1000)
  justificacion!: string;
}
