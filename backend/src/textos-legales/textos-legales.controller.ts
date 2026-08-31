import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TextosLegalesService } from './textos-legales.service';
import { CreateTextoLegalDto } from './dto/create-texto-legal.dto';
import { UpdateEstadoTextoLegalDto } from './dto/update-estado-texto-legal.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('textos-legales')
export class TextosLegalesController {
  constructor(private readonly textosLegalesService: TextosLegalesService) {}

  @Get(':tipo')
  listar(@Param('tipo') tipo: string) {
    return this.textosLegalesService.listar(tipo);
  }

  @Get(':tipo/activo')
  obtenerActivo(@Param('tipo') tipo: string) {
    return this.textosLegalesService.obtenerActivo(tipo);
  }

  @Post(':tipo')
  crearVersion(
    @Param('tipo') tipo: string,
    @Body() dto: CreateTextoLegalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.textosLegalesService.crearVersion(tipo, dto, user.login);
  }

  @Patch(':id/estado')
  actualizarEstado(@Param('id') id: string, @Body() dto: UpdateEstadoTextoLegalDto) {
    return this.textosLegalesService.actualizarEstado(id, dto.activo);
  }
}
