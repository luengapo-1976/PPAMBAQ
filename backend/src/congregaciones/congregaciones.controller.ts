import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CongregacionesService } from './congregaciones.service';
import { CreateCongregacionDto } from './dto/create-congregacion.dto';
import { UpdateCongregacionDto } from './dto/update-congregacion.dto';

@Controller('congregaciones')
export class CongregacionesController {
  constructor(private readonly congregacionesService: CongregacionesService) {}

  @Get()
  findAll() {
    return this.congregacionesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCongregacionDto) {
    return this.congregacionesService.create(dto);
  }

  @Patch(':codigo')
  update(@Param('codigo', ParseIntPipe) codigo: number, @Body() dto: UpdateCongregacionDto) {
    return this.congregacionesService.update(codigo, dto);
  }
}
