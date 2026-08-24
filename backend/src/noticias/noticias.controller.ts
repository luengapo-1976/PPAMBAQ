import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { NoticiasService } from './noticias.service';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('noticias')
export class NoticiasController {
  constructor(private readonly noticiasService: NoticiasService) {}

  @Get()
  findAll() {
    return this.noticiasService.findAll();
  }

  @Get('publicadas')
  findPublicadas() {
    return this.noticiasService.findPublicadas();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.noticiasService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateNoticiaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.noticiasService.create(dto, user.login);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoticiaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.noticiasService.update(id, dto, user.login);
  }
}
