import { Injectable } from '@nestjs/common';
import { NoticiasRepository } from './noticias.repository';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';
import { todayIsoDateBogota } from '../common/audit/audit.util';

@Injectable()
export class NoticiasService {
  constructor(private readonly noticiasRepository: NoticiasRepository) {}

  findAll() {
    return this.noticiasRepository.findAll();
  }

  findPublicadas() {
    return this.noticiasRepository.findPublicadas();
  }

  findById(id: string) {
    return this.noticiasRepository.findById(id);
  }

  create(dto: CreateNoticiaDto, usuarioLogin: string) {
    const hoy = todayIsoDateBogota();
    return this.noticiasRepository.create({
      ...dto,
      estado: dto.estado ?? 'BORRADOR',
      fecha_publicacion: dto.estado === 'PUBLICADA' ? hoy : null,
      usuario_registra: usuarioLogin,
      fecha_registro: hoy,
    });
  }

  /** Al publicar por primera vez (transición a PUBLICADA sin fecha_publicacion
   * previa) se fija la fecha de publicación; republicar no la vuelve a mover. */
  async update(id: string, dto: UpdateNoticiaDto, usuarioLogin: string) {
    const hoy = todayIsoDateBogota();
    const payload: UpdateNoticiaDto & { fecha_publicacion?: string } = { ...dto };

    if (dto.estado === 'PUBLICADA') {
      const actual = await this.noticiasRepository.findById(id);
      if (!actual.fecha_publicacion) {
        payload.fecha_publicacion = hoy;
      }
    }

    return this.noticiasRepository.update(id, {
      ...payload,
      usuario_modifica: usuarioLogin,
      fecha_modificacion: hoy,
    });
  }
}
