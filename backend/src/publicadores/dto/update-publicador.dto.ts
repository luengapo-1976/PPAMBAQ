import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicadorDto } from './create-publicador.dto';

export class UpdatePublicadorDto extends PartialType(CreatePublicadorDto) {}
