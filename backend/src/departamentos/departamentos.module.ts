import { Module } from '@nestjs/common';
import { DepartamentosController } from './departamentos.controller';
import { DepartamentosService } from './departamentos.service';
import { DepartamentosRepository } from './departamentos.repository';

@Module({
  controllers: [DepartamentosController],
  providers: [DepartamentosService, DepartamentosRepository],
})
export class DepartamentosModule {}
