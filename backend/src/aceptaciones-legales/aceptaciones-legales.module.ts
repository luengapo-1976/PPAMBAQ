import { Module } from '@nestjs/common';
import { AceptacionesLegalesController } from './aceptaciones-legales.controller';
import { AceptacionesLegalesService } from './aceptaciones-legales.service';
import { AceptacionesLegalesRepository } from './aceptaciones-legales.repository';
import { TextosLegalesModule } from '../textos-legales/textos-legales.module';

@Module({
  imports: [TextosLegalesModule],
  controllers: [AceptacionesLegalesController],
  providers: [AceptacionesLegalesService, AceptacionesLegalesRepository],
  exports: [AceptacionesLegalesService],
})
export class AceptacionesLegalesModule {}
