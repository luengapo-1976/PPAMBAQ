import { Injectable } from '@nestjs/common';
import { PuntosRepository } from './puntos.repository';
import { CreatePuntoDto } from './dto/create-punto.dto';
import { UpdatePuntoDto } from './dto/update-punto.dto';
import { todayIsoDate } from '../common/audit/audit.util';

@Injectable()
export class PuntosService {
  constructor(private readonly puntosRepository: PuntosRepository) {}

  findAll() {
    return this.puntosRepository.findAll();
  }

  create(dto: CreatePuntoDto, usuarioLogin: string) {
    return this.puntosRepository.create({
      ...dto,
      usuario_registra: usuarioLogin,
      fecha_registro: todayIsoDate(),
    });
  }

  update(codigo: number, dto: UpdatePuntoDto, usuarioLogin: string) {
    return this.puntosRepository.update(codigo, {
      ...dto,
      usuario_modifica: usuarioLogin,
      fecha_modificacion: todayIsoDate(),
    });
  }
}
