import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ParametrosService } from './parametros.service';
import { UpdateParametroDto } from './dto/update-parametro.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('parametros')
export class ParametrosController {
  constructor(private readonly parametrosService: ParametrosService) {}

  @Get()
  listar() {
    return this.parametrosService.listar();
  }

  @Put(':clave')
  actualizar(
    @Param('clave') clave: string,
    @Body() dto: UpdateParametroDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.parametrosService.actualizar(clave, dto, user.login);
  }
}
