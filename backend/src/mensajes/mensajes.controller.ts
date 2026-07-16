import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MensajesService } from './mensajes.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

const MAX_ADJUNTO_SIZE_BYTES = 10 * 1024 * 1024;

@Controller('mensajes')
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Get()
  findAll() {
    return this.mensajesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateMensajeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.mensajesService.create(dto, user.login);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMensajeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.mensajesService.update(id, dto, user.login);
  }

  @Post('adjuntos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_ADJUNTO_SIZE_BYTES },
    }),
  )
  uploadAdjunto(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo.');
    }
    return this.mensajesService.uploadAdjunto(file);
  }
}
