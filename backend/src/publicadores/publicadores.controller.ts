import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PublicadoresService } from './publicadores.service';
import { CreatePublicadorDto } from './dto/create-publicador.dto';
import { UpdatePublicadorDto } from './dto/update-publicador.dto';
import { NotificarEntrenamientoDto } from './dto/notificar-entrenamiento.dto';

@Controller('publicadores')
export class PublicadoresController {
  constructor(private readonly publicadoresService: PublicadoresService) {}

  @Get()
  findAll() {
    return this.publicadoresService.findAll();
  }

  @Post()
  create(@Body() dto: CreatePublicadorDto) {
    return this.publicadoresService.create(dto);
  }

  @Patch('notificar-entrenamiento')
  notificarEntrenamiento(@Body() dto: NotificarEntrenamientoDto) {
    return this.publicadoresService.notificarEntrenamiento(dto.ids);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePublicadorDto) {
    return this.publicadoresService.update(id, dto);
  }
}
