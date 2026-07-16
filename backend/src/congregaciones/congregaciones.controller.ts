import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CongregacionesService } from './congregaciones.service';
import { CreateCongregacionDto } from './dto/create-congregacion.dto';
import { UpdateCongregacionDto } from './dto/update-congregacion.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('congregaciones')
export class CongregacionesController {
  constructor(private readonly congregacionesService: CongregacionesService) {}

  @Get()
  findAll() {
    return this.congregacionesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCongregacionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.congregacionesService.create(dto, user.login);
  }

  @Patch(':codigo')
  update(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Body() dto: UpdateCongregacionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.congregacionesService.update(codigo, dto, user.login);
  }
}
