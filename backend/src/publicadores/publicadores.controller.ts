import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PublicadoresService } from './publicadores.service';
import { CreatePublicadorDto } from './dto/create-publicador.dto';
import { UpdatePublicadorDto } from './dto/update-publicador.dto';
import { NotificarEntrenamientoDto } from './dto/notificar-entrenamiento.dto';
import { AsignarLugarEntrenamientoDto } from './dto/asignar-lugar-entrenamiento.dto';
import { QuitarLugarEntrenamientoDto } from './dto/quitar-lugar-entrenamiento.dto';
import { ConfirmarAsistenciaDto } from './dto/confirmar-asistencia.dto';
import { MarcarExisteBdAnteriorDto } from './dto/marcar-existe-bd-anterior.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('publicadores')
export class PublicadoresController {
  constructor(private readonly publicadoresService: PublicadoresService) {}

  @Get()
  findAll() {
    return this.publicadoresService.findAll();
  }

  @Post()
  create(@Body() dto: CreatePublicadorDto, @CurrentUser() user: AuthenticatedUser) {
    return this.publicadoresService.create(dto, user.login);
  }

  @Patch('notificar-entrenamiento')
  notificarEntrenamiento(@Body() dto: NotificarEntrenamientoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.publicadoresService.notificarEntrenamiento(dto.ids, dto.mensajeRelacionadoCon, user.login);
  }

  @Patch('asignar-lugar-entrenamiento')
  asignarLugarEntrenamiento(@Body() dto: AsignarLugarEntrenamientoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.publicadoresService.asignarLugarEntrenamiento(dto, user.login);
  }

  @Patch('quitar-lugar-entrenamiento')
  quitarLugarEntrenamiento(@Body() dto: QuitarLugarEntrenamientoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.publicadoresService.quitarLugarEntrenamiento(dto.ids, user.login);
  }

  @Patch('confirmar-asistencia')
  confirmarAsistencia(@Body() dto: ConfirmarAsistenciaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.publicadoresService.confirmarAsistencia(dto.ids, dto.tipoEntrenamiento, user.login);
  }

  @Patch('revertir-asistencia')
  revertirAsistencia(@Body() dto: ConfirmarAsistenciaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.publicadoresService.revertirAsistencia(dto.ids, dto.tipoEntrenamiento, user.login);
  }

  @Patch('marcar-existe-bd-anterior')
  marcarExisteBdAnterior(@Body() dto: MarcarExisteBdAnteriorDto, @CurrentUser() user: AuthenticatedUser) {
    return this.publicadoresService.marcarExisteBdAnterior(dto.ids, user.login);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePublicadorDto, @CurrentUser() user: AuthenticatedUser) {
    return this.publicadoresService.update(id, dto, user.login);
  }
}
