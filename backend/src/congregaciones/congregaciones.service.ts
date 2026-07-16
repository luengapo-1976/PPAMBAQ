import { Injectable } from '@nestjs/common';
import { CongregacionesRepository } from './congregaciones.repository';
import { CreateCongregacionDto } from './dto/create-congregacion.dto';
import { UpdateCongregacionDto } from './dto/update-congregacion.dto';
import { todayIsoDate } from '../common/audit/audit.util';

@Injectable()
export class CongregacionesService {
  constructor(private readonly congregacionesRepository: CongregacionesRepository) {}

  findAll() {
    return this.congregacionesRepository.findAll();
  }

  create(dto: CreateCongregacionDto, usuarioLogin: string) {
    return this.congregacionesRepository.create({
      ...dto,
      usuario_registra: usuarioLogin,
      fecha_registro: todayIsoDate(),
    });
  }

  update(codigo: number, dto: UpdateCongregacionDto, usuarioLogin: string) {
    return this.congregacionesRepository.update(codigo, {
      ...dto,
      usuario_modifica: usuarioLogin,
      fecha_modificacion: todayIsoDate(),
    });
  }
}
