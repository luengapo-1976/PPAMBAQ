import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AprobarSolicitudDto {
  @IsString()
  @IsNotEmpty({ message: 'Debes indicar una justificación de aprobación.' })
  @MaxLength(1000)
  justificacion!: string;
}
