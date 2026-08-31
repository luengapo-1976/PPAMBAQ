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
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { MoverBannerDto } from './dto/mover-banner.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

const MAX_BANNER_SIZE_BYTES = 10 * 1024 * 1024;

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  findAll() {
    return this.bannersService.findAll();
  }

  @Get('visibles')
  findVisibles() {
    return this.bannersService.findVisibles();
  }

  @Post()
  create(@Body() dto: CreateBannerDto, @CurrentUser() user: AuthenticatedUser) {
    return this.bannersService.create(dto, user.login);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBannerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bannersService.update(id, dto, user.login);
  }

  @Patch(':id/mover')
  mover(@Param('id') id: string, @Body() dto: MoverBannerDto) {
    return this.bannersService.mover(id, dto.direccion);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }

  @Post('imagenes')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_BANNER_SIZE_BYTES },
    }),
  )
  uploadImagen(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo.');
    }
    return this.bannersService.uploadImagen(file);
  }
}
