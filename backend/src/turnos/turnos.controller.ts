import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { TurnosService } from './turnos.service';
import { SolicitarTurnoDto } from './dto/solicitar-turno.dto';
import { DevolverTurnoDto } from './dto/devolver-turno.dto';
import { ReportarActividadDto } from './dto/reportar-actividad.dto';
import { AprobarSolicitudDto } from './dto/aprobar-solicitud.dto';
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

  @Get('validacion/pendientes')
  pendientesValidacion() {
    return this.turnosService.pendientesValidacion();
  }

  @Get('validacion/aprobados')
  aprobadosValidacion() {
    return this.turnosService.aprobadosValidacion();
  }

  @Post(':id/aprobar-solicitud')
  aprobarSolicitud(@Param('id') id: string, @Body() dto: AprobarSolicitudDto, @CurrentUser() user: AuthenticatedUser) {
    return this.turnosService.aprobarSolicitudPendiente(id, dto, user);
  }

  @Post(':id/solicitar')
  solicitar(@Param('id') id: string, @Body() dto: SolicitarTurnoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.turnosService.solicitar(id, dto, user);
  }

  @Post(':id/devolver')
  devolver(@Param('id') id: string, @Body() dto: DevolverTurnoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.turnosService.devolver(id, dto, user);
  }

  @Get(':id/actividad-disponibilidad')
  verificarDisponibilidadActividad(
    @Param('id') id: string,
    @Query('fecha') fecha: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.verificarDisponibilidadActividad(id, fecha, user);
  }

  @Post(':id/actividad-reportada')
  reportarActividad(@Param('id') id: string, @Body() dto: ReportarActividadDto, @CurrentUser() user: AuthenticatedUser) {
    return this.turnosService.reportarActividad(id, dto, user);
  }

  @Get(':id/actividad-historial')
  historialActividad(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.turnosService.historialActividad(id, user);
  }
}
