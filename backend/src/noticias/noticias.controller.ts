import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { NoticiasService } from './noticias.service';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';
import { MoverNoticiaDto } from './dto/mover-noticia.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

const MAX_IMAGEN_SIZE_BYTES = 10 * 1024 * 1024;

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
  create(
    @Body() dto: CreateNoticiaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.noticiasService.create(dto, user.login);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNoticiaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.noticiasService.update(id, dto, user.login);
  }

  @Patch(':id/mover')
  mover(@Param('id') id: string, @Body() dto: MoverNoticiaDto) {
    return this.noticiasService.mover(id, dto.direccion);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noticiasService.remove(id);
  }

  @Post('imagenes')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGEN_SIZE_BYTES },
    }),
  )
  uploadImagen(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo.');
    }
    return this.noticiasService.uploadImagen(file);
  }
}
