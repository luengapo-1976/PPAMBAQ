import { Injectable } from '@nestjs/common';
import { MensajesRepository } from './mensajes.repository';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';
import { todayIsoDate } from '../common/audit/audit.util';

@Injectable()
export class MensajesService {
  constructor(private readonly mensajesRepository: MensajesRepository) {}

  findAll() {
    return this.mensajesRepository.findAll();
  }

  create(dto: CreateMensajeDto, usuarioLogin: string) {
    return this.mensajesRepository.create({
      ...dto,
      usuario_registra: usuarioLogin,
      fecha_registro: todayIsoDate(),
    });
  }

  update(id: string, dto: UpdateMensajeDto, usuarioLogin: string) {
    return this.mensajesRepository.update(id, {
      ...dto,
      usuario_modifica: usuarioLogin,
      fecha_modificacion: todayIsoDate(),
    });
  }

  uploadAdjunto(file: Express.Multer.File) {
    return this.mensajesRepository.uploadAdjunto(file);
  }
}
