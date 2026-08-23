import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { TurnosService } from './turnos.service';
import { SolicitarTurnoDto } from './dto/solicitar-turno.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('turnos')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @Get()
  findByCodigoPunto(@Query('codigo_punto', ParseIntPipe) codigoPunto: number) {
    return this.turnosService.findByCodigoPunto(codigoPunto);
  }

  @Get('conteo-publicador')
  contarSolicitadosPorUsuario(@CurrentUser() user: AuthenticatedUser) {
    return this.turnosService.contarSolicitadosPorUsuario(user);
  }

  @Post(':id/solicitar')
  solicitar(@Param('id') id: string, @Body() dto: SolicitarTurnoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.turnosService.solicitar(id, dto, user);
  }
}
