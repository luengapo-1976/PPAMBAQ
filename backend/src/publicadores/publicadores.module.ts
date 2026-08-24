import { Module } from '@nestjs/common';
import { PublicadoresController } from './publicadores.controller';
import { PublicadoresService } from './publicadores.service';
import { PublicadoresRepository } from './publicadores.repository';
import { TurnosRepository } from '../turnos/turnos.repository';

@Module({
  controllers: [PublicadoresController],
  providers: [PublicadoresService, PublicadoresRepository, TurnosRepository],
  exports: [PublicadoresRepository],
})
export class PublicadoresModule {}
