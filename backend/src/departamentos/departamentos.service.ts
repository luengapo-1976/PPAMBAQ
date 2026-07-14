import { Injectable } from '@nestjs/common';
import { DepartamentosRepository } from './departamentos.repository';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';

@Injectable()
export class DepartamentosService {
  constructor(private readonly departamentosRepository: DepartamentosRepository) {}

  findAll() {
    return this.departamentosRepository.findAll();
  }

  create(dto: CreateDepartamentoDto) {
    return this.departamentosRepository.create(dto);
  }

  update(codigo: string, dto: UpdateDepartamentoDto) {
    return this.departamentosRepository.update(codigo, dto);
  }
}
