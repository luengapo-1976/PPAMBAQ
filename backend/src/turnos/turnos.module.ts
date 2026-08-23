import { Module } from '@nestjs/common';
import { TurnosController } from './turnos.controller';
import { TurnosService } from './turnos.service';
import { TurnosRepository } from './turnos.repository';
import { PublicadoresModule } from '../publicadores/publicadores.module';
import { PuntosModule } from '../puntos/puntos.module';

@Module({
  imports: [PublicadoresModule, PuntosModule],
  controllers: [TurnosController],
  providers: [TurnosService, TurnosRepository],
})
export class TurnosModule {}
