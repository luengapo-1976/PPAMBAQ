import { Module } from '@nestjs/common';
import { PublicadoresController } from './publicadores.controller';
import { PublicadoresService } from './publicadores.service';
import { PublicadoresRepository } from './publicadores.repository';

@Module({
  controllers: [PublicadoresController],
  providers: [PublicadoresService, PublicadoresRepository],
  exports: [PublicadoresRepository],
})
export class PublicadoresModule {}
