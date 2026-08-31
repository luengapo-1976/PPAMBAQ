import { IsBoolean } from 'class-validator';

export class UpdateEstadoTextoLegalDto {
  @IsBoolean()
  activo!: boolean;
}
