import { Injectable } from '@nestjs/common';
import { imageSize } from 'image-size';
import { BannersRepository } from './banners.repository';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { todayIsoDateBogota } from '../common/audit/audit.util';

@Injectable()
export class BannersService {
  constructor(private readonly bannersRepository: BannersRepository) {}

  findAll() {
    return this.bannersRepository.findAll();
  }

  findVisibles() {
    return this.bannersRepository.findVisibles();
  }

  async create(dto: CreateBannerDto, usuarioLogin: string) {
    const hoy = todayIsoDateBogota();
    const maxOrden = await this.bannersRepository.findMaxOrden();

    return this.bannersRepository.create({
      ...dto,
      activo: dto.activo ?? true,
      orden: maxOrden + 1,
      usuario_registra: usuarioLogin,
      fecha_registro: hoy,
    });
  }

  update(id: string, dto: UpdateBannerDto, usuarioLogin: string) {
    const hoy = todayIsoDateBogota();
    return this.bannersRepository.update(id, {
      ...dto,
      usuario_modifica: usuarioLogin,
      fecha_modificacion: hoy,
    });
  }

  remove(id: string) {
    return this.bannersRepository.delete(id);
  }

  mover(id: string, direccion: 'arriba' | 'abajo') {
    return this.bannersRepository.moverOrden(id, direccion);
  }

  /** No se rechaza por proporción: el cliente ya recorta y ajusta cualquier imagen
   * a 1892x720 antes de subirla (igual que "object-fit: cover", sin deformar). Aquí
   * solo se lee la dimensión real para guardarla como metadata del banner. */
  async uploadImagen(file: Express.Multer.File) {
    const { width, height } = imageSize(file.buffer);
    const { url, path } = await this.bannersRepository.uploadImagen(file);
    return { url, path, width, height };
  }
}
