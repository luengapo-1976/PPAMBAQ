import { Module } from '@nestjs/common';
import { TextosLegalesController } from './textos-legales.controller';
import { TextosLegalesService } from './textos-legales.service';
import { TextosLegalesRepository } from './textos-legales.repository';

@Module({
  controllers: [TextosLegalesController],
  providers: [TextosLegalesService, TextosLegalesRepository],
  exports: [TextosLegalesService],
})
export class TextosLegalesModule {}
