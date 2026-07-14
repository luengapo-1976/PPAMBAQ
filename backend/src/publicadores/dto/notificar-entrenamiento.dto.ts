import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class NotificarEntrenamientoDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];
}
