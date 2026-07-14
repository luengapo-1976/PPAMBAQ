import { Module } from '@nestjs/common';
import { MunicipiosController } from './municipios.controller';
import { MunicipiosService } from './municipios.service';
import { MunicipiosRepository } from './municipios.repository';

@Module({
  controllers: [MunicipiosController],
  providers: [MunicipiosService, MunicipiosRepository],
})
export class MunicipiosModule {}
