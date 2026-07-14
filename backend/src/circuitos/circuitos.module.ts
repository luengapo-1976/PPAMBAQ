import { Module } from '@nestjs/common';
import { CircuitosController } from './circuitos.controller';
import { CircuitosService } from './circuitos.service';
import { CircuitosRepository } from './circuitos.repository';

@Module({
  controllers: [CircuitosController],
  providers: [CircuitosService, CircuitosRepository],
})
export class CircuitosModule {}
