import { Module } from '@nestjs/common';
import { PuntosController } from './puntos.controller';
import { PuntosService } from './puntos.service';
import { PuntosRepository } from './puntos.repository';
import { PublicadoresModule } from '../publicadores/publicadores.module';

@Module({
  imports: [PublicadoresModule],
  controllers: [PuntosController],
  providers: [PuntosService, PuntosRepository],
  exports: [PuntosRepository],
})
export class PuntosModule {}
