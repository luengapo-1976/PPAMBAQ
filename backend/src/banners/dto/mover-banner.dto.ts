import { IsIn } from 'class-validator';

const DIRECCIONES = ['arriba', 'abajo'] as const;

export class MoverBannerDto {
  @IsIn(DIRECCIONES, { message: 'La dirección debe ser "arriba" o "abajo".' })
  direccion!: (typeof DIRECCIONES)[number];
}
