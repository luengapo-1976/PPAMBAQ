import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MunicipiosService } from './municipios.service';
import { CreateMunicipioDto } from './dto/create-municipio.dto';
import { UpdateMunicipioDto } from './dto/update-municipio.dto';

@Controller('municipios')
export class MunicipiosController {
  constructor(private readonly municipiosService: MunicipiosService) {}

  @Get()
  findAll(@Query('codigo_departamento') codigoDepartamento?: string) {
    return this.municipiosService.findAll(codigoDepartamento);
  }

  @Post()
  create(@Body() dto: CreateMunicipioDto) {
    return this.municipiosService.create(dto);
  }

  @Patch(':codigo')
  update(@Param('codigo') codigo: string, @Body() dto: UpdateMunicipioDto) {
    return this.municipiosService.update(codigo, dto);
  }
}
