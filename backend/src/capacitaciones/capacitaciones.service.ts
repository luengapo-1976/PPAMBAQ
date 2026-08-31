import { BadRequestException, Injectable } from '@nestjs/common';
import { CapacitacionesRepository } from './capacitaciones.repository';
import { CreateCapacitacionDto } from './dto/create-capacitacion.dto';
import { UpdateCapacitacionDto } from './dto/update-capacitacion.dto';
import { todayIsoDateBogota } from '../common/audit/audit.util';

@Injectable()
export class CapacitacionesService {
  constructor(
    private readonly capacitacionesRepository: CapacitacionesRepository,
  ) {}

  findAll() {
    return this.capacitacionesRepository.findAll();
  }

  findVisibles() {
    return this.capacitacionesRepository.findVisibles();
  }

  findById(id: string) {
    return this.capacitacionesRepository.findById(id);
  }

  async create(dto: CreateCapacitacionDto, usuarioLogin: string) {
    this.validarContenidoSegunTipo(dto.tipo, dto);

    const hoy = todayIsoDateBogota();
    const maxOrden = await this.capacitacionesRepository.findMaxOrden();

    return this.capacitacionesRepository.create({
      ...dto,
      activo: true,
      orden: maxOrden + 1,
      usuario_registra: usuarioLogin,
      fecha_registro: hoy,
    });
  }

  async update(id: string, dto: UpdateCapacitacionDto, usuarioLogin: string) {
    if (dto.tipo) {
      this.validarContenidoSegunTipo(dto.tipo, dto);
    }

    const hoy = todayIsoDateBogota();
    return this.capacitacionesRepository.update(id, {
      ...dto,
      usuario_modifica: usuarioLogin,
      fecha_modificacion: hoy,
    });
  }

  remove(id: string) {
    return this.capacitacionesRepository.delete(id);
  }

  mover(id: string, direccion: 'arriba' | 'abajo') {
    return this.capacitacionesRepository.moverOrden(id, direccion);
  }

  async uploadImagen(file: Express.Multer.File) {
    const { url, path } =
      await this.capacitacionesRepository.uploadImagen(file);
    return { url, path };
  }

  private validarContenidoSegunTipo(
    tipo: 'IMAGEN' | 'VIDEO',
    dto: { imagen_url?: string | null; video_url?: string | null },
  ): void {
    if (tipo === 'IMAGEN' && !dto.imagen_url) {
      throw new BadRequestException(
        'Debes cargar una imagen para este tipo de capacitación.',
      );
    }
    if (tipo === 'VIDEO' && !dto.video_url) {
      throw new BadRequestException(
        'Debes indicar el enlace del video para este tipo de capacitación.',
      );
    }
  }
}
