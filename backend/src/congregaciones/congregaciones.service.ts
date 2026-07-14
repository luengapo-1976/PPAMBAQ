import { Injectable } from '@nestjs/common';
import { CongregacionesRepository } from './congregaciones.repository';
import { CreateCongregacionDto } from './dto/create-congregacion.dto';
import { UpdateCongregacionDto } from './dto/update-congregacion.dto';
import { CURRENT_USER_LOGIN, todayIsoDate } from '../common/audit/audit.util';

@Injectable()
export class CongregacionesService {
  constructor(private readonly congregacionesRepository: CongregacionesRepository) {}

  findAll() {
    return this.congregacionesRepository.findAll();
  }

  create(dto: CreateCongregacionDto) {
    return this.congregacionesRepository.create({
      ...dto,
      usuario_registra: CURRENT_USER_LOGIN,
      fecha_registro: todayIsoDate(),
    });
  }

  update(codigo: number, dto: UpdateCongregacionDto) {
    return this.congregacionesRepository.update(codigo, {
      ...dto,
      usuario_modifica: CURRENT_USER_LOGIN,
      fecha_modificacion: todayIsoDate(),
    });
  }
}
