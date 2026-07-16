import { Injectable } from '@nestjs/common';
import { CircuitosRepository } from './circuitos.repository';
import { CreateCircuitoDto } from './dto/create-circuito.dto';
import { UpdateCircuitoDto } from './dto/update-circuito.dto';
import { todayIsoDate } from '../common/audit/audit.util';

@Injectable()
export class CircuitosService {
  constructor(private readonly circuitosRepository: CircuitosRepository) {}

  findAll() {
    return this.circuitosRepository.findAll();
  }

  create(dto: CreateCircuitoDto, usuarioLogin: string) {
    return this.circuitosRepository.create({
      ...dto,
      usuario_registra: usuarioLogin,
      fecha_registro: todayIsoDate(),
    });
  }

  update(codigo: string, dto: UpdateCircuitoDto, usuarioLogin: string) {
    return this.circuitosRepository.update(codigo, {
      ...dto,
      usuario_modifica: usuarioLogin,
      fecha_modificacion: todayIsoDate(),
    });
  }
}
