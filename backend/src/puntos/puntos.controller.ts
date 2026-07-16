import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { PuntosService } from './puntos.service';
import { CreatePuntoDto } from './dto/create-punto.dto';
import { UpdatePuntoDto } from './dto/update-punto.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('puntos')
export class PuntosController {
  constructor(private readonly puntosService: PuntosService) {}

  @Get()
  findAll() {
    return this.puntosService.findAll();
  }

  @Post()
  create(@Body() dto: CreatePuntoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.puntosService.create(dto, user.login);
  }

  @Patch(':codigo')
  update(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Body() dto: UpdatePuntoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.puntosService.update(codigo, dto, user.login);
  }
}
