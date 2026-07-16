import { ArrayNotEmpty, IsArray, IsIn, IsString } from 'class-validator';

export type MensajeRelacionadoCon = 'Primer entrenamiento' | 'Segundo entrenamiento' | 'otro';

export const MENSAJE_RELACIONADO_CON_VALUES: MensajeRelacionadoCon[] = [
  'Primer entrenamiento',
  'Segundo entrenamiento',
  'otro',
];

export class NotificarEntrenamientoDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];

  @IsIn(MENSAJE_RELACIONADO_CON_VALUES)
  mensajeRelacionadoCon!: MensajeRelacionadoCon;
}
