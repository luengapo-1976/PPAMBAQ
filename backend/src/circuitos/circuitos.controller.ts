import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CircuitosService } from './circuitos.service';
import { CreateCircuitoDto } from './dto/create-circuito.dto';
import { UpdateCircuitoDto } from './dto/update-circuito.dto';

@Controller('circuitos')
export class CircuitosController {
  constructor(private readonly circuitosService: CircuitosService) {}

  @Get()
  findAll() {
    return this.circuitosService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCircuitoDto) {
    return this.circuitosService.create(dto);
  }

  @Patch(':codigo')
  update(@Param('codigo') codigo: string, @Body() dto: UpdateCircuitoDto) {
    return this.circuitosService.update(codigo, dto);
  }
}
