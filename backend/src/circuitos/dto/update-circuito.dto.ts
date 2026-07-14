import { PartialType } from '@nestjs/mapped-types';
import { OmitType } from '@nestjs/mapped-types';
import { CreateCircuitoDto } from './create-circuito.dto';

export class UpdateCircuitoDto extends PartialType(OmitType(CreateCircuitoDto, ['codigo_circuito'] as const)) {}
