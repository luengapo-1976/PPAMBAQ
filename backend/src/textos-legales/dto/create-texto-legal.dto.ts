import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateTextoLegalDto {
  @IsString()
  @IsNotEmpty()
  contenido!: string;

  @IsBoolean()
  activo!: boolean;
}
