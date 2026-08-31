import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RechazarSolicitudDto {
  @IsString()
  @IsNotEmpty({ message: 'Debes indicar una justificación de rechazo.' })
  @MaxLength(1000)
  justificacion!: string;
}
