import { Module } from '@nestjs/common';
import { ParametrosController } from './parametros.controller';
import { ParametrosService } from './parametros.service';
import { ParametrosRepository } from './parametros.repository';

@Module({
  controllers: [ParametrosController],
  providers: [ParametrosService, ParametrosRepository],
  exports: [ParametrosService],
})
export class ParametrosModule {}
