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
import { CapacitacionesService } from './capacitaciones.service';
import { CreateCapacitacionDto } from './dto/create-capacitacion.dto';
import { UpdateCapacitacionDto } from './dto/update-capacitacion.dto';
import { MoverCapacitacionDto } from './dto/mover-capacitacion.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

const MAX_IMAGEN_SIZE_BYTES = 10 * 1024 * 1024;

@Controller('capacitaciones')
export class CapacitacionesController {
  constructor(private readonly capacitacionesService: CapacitacionesService) {}

  @Get()
  findAll() {
    return this.capacitacionesService.findAll();
  }

  @Get('visibles')
  findVisibles() {
    return this.capacitacionesService.findVisibles();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.capacitacionesService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateCapacitacionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.capacitacionesService.create(dto, user.login);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCapacitacionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.capacitacionesService.update(id, dto, user.login);
  }

  @Patch(':id/mover')
  mover(@Param('id') id: string, @Body() dto: MoverCapacitacionDto) {
    return this.capacitacionesService.mover(id, dto.direccion);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.capacitacionesService.remove(id);
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
    return this.capacitacionesService.uploadImagen(file);
  }
}
