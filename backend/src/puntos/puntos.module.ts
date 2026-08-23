import { Module } from '@nestjs/common';
import { PuntosController } from './puntos.controller';
import { PuntosService } from './puntos.service';
import { PuntosRepository } from './puntos.repository';

@Module({
  controllers: [PuntosController],
  providers: [PuntosService, PuntosRepository],
  exports: [PuntosRepository],
})
export class PuntosModule {}
