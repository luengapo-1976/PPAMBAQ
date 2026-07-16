import { ArrayNotEmpty, IsArray, IsDateString, IsIn, IsInt, IsString } from 'class-validator';

export type TipoEntrenamiento = 'Primer entrenamiento' | 'Segundo entrenamiento';

export const TIPO_ENTRENAMIENTO_VALUES: TipoEntrenamiento[] = ['Primer entrenamiento', 'Segundo entrenamiento'];

export class AsignarLugarEntrenamientoDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];

  @IsIn(TIPO_ENTRENAMIENTO_VALUES)
  tipoEntrenamiento!: TipoEntrenamiento;

  @IsDateString()
  fecha!: string;

  @IsInt()
  codigoPunto!: number;
}
