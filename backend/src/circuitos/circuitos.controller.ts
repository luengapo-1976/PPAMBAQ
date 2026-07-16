import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CircuitosService } from './circuitos.service';
import { CreateCircuitoDto } from './dto/create-circuito.dto';
import { UpdateCircuitoDto } from './dto/update-circuito.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('circuitos')
export class CircuitosController {
  constructor(private readonly circuitosService: CircuitosService) {}

  @Get()
  findAll() {
    return this.circuitosService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCircuitoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.circuitosService.create(dto, user.login);
  }

  @Patch(':codigo')
  update(@Param('codigo') codigo: string, @Body() dto: UpdateCircuitoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.circuitosService.update(codigo, dto, user.login);
  }
}
