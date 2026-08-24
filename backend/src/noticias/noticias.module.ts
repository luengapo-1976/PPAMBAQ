import { Module } from '@nestjs/common';
import { NoticiasController } from './noticias.controller';
import { NoticiasService } from './noticias.service';
import { NoticiasRepository } from './noticias.repository';

@Module({
  controllers: [NoticiasController],
  providers: [NoticiasService, NoticiasRepository],
})
export class NoticiasModule {}
