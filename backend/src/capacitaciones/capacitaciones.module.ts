import { Module } from '@nestjs/common';
import { CapacitacionesController } from './capacitaciones.controller';
import { CapacitacionesService } from './capacitaciones.service';
import { CapacitacionesRepository } from './capacitaciones.repository';

@Module({
  controllers: [CapacitacionesController],
  providers: [CapacitacionesService, CapacitacionesRepository],
})
export class CapacitacionesModule {}
