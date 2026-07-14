import { Module } from '@nestjs/common';
import { CongregacionesController } from './congregaciones.controller';
import { CongregacionesService } from './congregaciones.service';
import { CongregacionesRepository } from './congregaciones.repository';

@Module({
  controllers: [CongregacionesController],
  providers: [CongregacionesService, CongregacionesRepository],
})
export class CongregacionesModule {}
