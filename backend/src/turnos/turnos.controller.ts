import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TurnosService } from './turnos.service';
import { SolicitarTurnoDto } from './dto/solicitar-turno.dto';
import { DevolverTurnoDto } from './dto/devolver-turno.dto';
import { ReportarActividadDto } from './dto/reportar-actividad.dto';
import { AprobarSolicitudDto } from './dto/aprobar-solicitud.dto';
import { RechazarSolicitudDto } from './dto/rechazar-solicitud.dto';
import { CrearTurnoDto } from './dto/crear-turno.dto';
import { ActualizarEstadoTurnoDto } from './dto/actualizar-estado-turno.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('turnos')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @Get()
  findByCodigoPunto(
    @Query('codigo_punto', ParseIntPipe) codigoPunto: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.findByCodigoPunto(codigoPunto, user);
  }

  @Post()
  crearTurno(
    @Body() dto: CrearTurnoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.crearTurno(dto, user);
  }

  @Patch(':id/estado')
  actualizarEstadoTurno(
    @Param('id') id: string,
    @Body() dto: ActualizarEstadoTurnoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.actualizarEstadoTurno(id, dto, user);
  }

  @Delete(':id')
  eliminarHorario(@Param('id') id: string) {
    return this.turnosService.eliminarHorario(id);
  }

  @Get('conteo-publicador')
  contarSolicitadosPorUsuario(
    @Query('id_publicador') idPublicador: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.contarSolicitadosPorUsuario(user, idPublicador);
  }

  @Get('historial-solicitudes')
  historialSolicitudes(
    @Query('id_publicador') idPublicador: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.historialSolicitudesPublicador(
      idPublicador ?? user.publicadorId,
    );
  }

  @Get('validacion/pendientes')
  pendientesValidacion() {
    return this.turnosService.pendientesValidacion();
  }

  @Get('validacion/aprobados')
  aprobadosValidacion() {
    return this.turnosService.aprobadosValidacion();
  }

  @Get('validacion/rechazados')
  rechazadosValidacion() {
    return this.turnosService.rechazadosValidacion();
  }

  @Post(':id/aprobar-solicitud')
  aprobarSolicitud(
    @Param('id') id: string,
    @Body() dto: AprobarSolicitudDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.aprobarSolicitudPendiente(id, dto, user);
  }

  @Post(':id/rechazar-solicitud')
  rechazarSolicitud(
    @Param('id') id: string,
    @Body() dto: RechazarSolicitudDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.rechazarSolicitudPendiente(id, dto, user);
  }

  @Patch('validacion/:estado/:id/whatsapp-enviado')
  marcarMensajeWhatsappEnviado(@Param('estado') estado: string, @Param('id') id: string) {
    if (estado !== 'aprobados' && estado !== 'rechazados') {
      throw new BadRequestException('El estado indicado no es válido.');
    }
    return this.turnosService.marcarMensajeWhatsappEnviado(estado, id);
  }

  @Post(':id/solicitar')
  solicitar(
    @Param('id') id: string,
    @Body() dto: SolicitarTurnoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.solicitar(id, dto, user);
  }

  @Post(':id/devolver')
  devolver(
    @Param('id') id: string,
    @Body() dto: DevolverTurnoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.devolver(id, dto, user);
  }

  @Get(':id/actividad-disponibilidad')
  verificarDisponibilidadActividad(
    @Param('id') id: string,
    @Query('fecha') fecha: string,
    @Query('id_publicador') idPublicador: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.verificarDisponibilidadActividad(
      id,
      fecha,
      user,
      idPublicador,
    );
  }

  @Post(':id/actividad-reportada')
  reportarActividad(
    @Param('id') id: string,
    @Body() dto: ReportarActividadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.reportarActividad(id, dto, user);
  }

  @Get(':id/actividad-historial')
  historialActividad(
    @Param('id') id: string,
    @Query('id_publicador') idPublicador: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turnosService.historialActividad(id, user, idPublicador);
  }
}
