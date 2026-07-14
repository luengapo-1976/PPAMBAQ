import { Injectable } from '@nestjs/common';
import { CircuitosRepository } from './circuitos.repository';
import { CreateCircuitoDto } from './dto/create-circuito.dto';
import { UpdateCircuitoDto } from './dto/update-circuito.dto';
import { CURRENT_USER_LOGIN, todayIsoDate } from '../common/audit/audit.util';

@Injectable()
export class CircuitosService {
  constructor(private readonly circuitosRepository: CircuitosRepository) {}

  findAll() {
    return this.circuitosRepository.findAll();
  }

  create(dto: CreateCircuitoDto) {
    return this.circuitosRepository.create({
      ...dto,
      usuario_registra: CURRENT_USER_LOGIN,
      fecha_registro: todayIsoDate(),
    });
  }

  update(codigo: string, dto: UpdateCircuitoDto) {
    return this.circuitosRepository.update(codigo, {
      ...dto,
      usuario_modifica: CURRENT_USER_LOGIN,
      fecha_modificacion: todayIsoDate(),
    });
  }
}
