import { Controller, Param, Post } from '@nestjs/common';
import { AceptacionesLegalesService } from './aceptaciones-legales.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('aceptaciones-legales')
export class AceptacionesLegalesController {
  constructor(private readonly aceptacionesLegalesService: AceptacionesLegalesService) {}

  @Post(':tipo')
  aceptar(@Param('tipo') tipo: string, @CurrentUser() user: AuthenticatedUser) {
    return this.aceptacionesLegalesService.aceptar(user.publicadorId, tipo, user.login);
  }
}
