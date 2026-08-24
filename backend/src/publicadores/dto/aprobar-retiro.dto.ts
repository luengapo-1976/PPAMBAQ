import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AprobarRetiroDto {
  @IsString()
  @IsNotEmpty({ message: 'Debes indicar una justificación de aprobación.' })
  @MaxLength(1000)
  observaciones!: string;
}
