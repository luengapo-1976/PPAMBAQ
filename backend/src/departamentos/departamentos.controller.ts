import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { DepartamentosService } from './departamentos.service';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';

@Controller('departamentos')
export class DepartamentosController {
  constructor(private readonly departamentosService: DepartamentosService) {}

  @Get()
  findAll() {
    return this.departamentosService.findAll();
  }

  @Post()
  create(@Body() dto: CreateDepartamentoDto) {
    return this.departamentosService.create(dto);
  }

  @Patch(':codigo')
  update(@Param('codigo') codigo: string, @Body() dto: UpdateDepartamentoDto) {
    return this.departamentosService.update(codigo, dto);
  }
}
