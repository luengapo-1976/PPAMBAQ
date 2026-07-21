import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class MarcarExisteBdAnteriorDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];
}
