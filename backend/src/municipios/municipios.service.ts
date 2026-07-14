import { Injectable } from '@nestjs/common';
import { MunicipiosRepository } from './municipios.repository';
import { CreateMunicipioDto } from './dto/create-municipio.dto';
import { UpdateMunicipioDto } from './dto/update-municipio.dto';

@Injectable()
export class MunicipiosService {
  constructor(private readonly municipiosRepository: MunicipiosRepository) {}

  findAll(codigoDepartamento?: string) {
    return this.municipiosRepository.findAll(codigoDepartamento);
  }

  create(dto: CreateMunicipioDto) {
    return this.municipiosRepository.create(dto);
  }

  update(codigo: string, dto: UpdateMunicipioDto) {
    return this.municipiosRepository.update(codigo, dto);
  }
}
