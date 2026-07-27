import { ArrayNotEmpty, IsArray, IsIn, IsString } from 'class-validator';
import { TIPO_ENTRENAMIENTO_VALUES } from './asignar-lugar-entrenamiento.dto';
import type { TipoEntrenamiento } from './asignar-lugar-entrenamiento.dto';

export class ConfirmarAsistenciaDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];

  @IsIn(TIPO_ENTRENAMIENTO_VALUES)
  tipoEntrenamiento!: TipoEntrenamiento;
}
