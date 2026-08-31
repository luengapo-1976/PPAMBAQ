import { Injectable } from '@nestjs/common';
import { PuntosRepository } from './puntos.repository';
import { PublicadoresRepository } from '../publicadores/publicadores.repository';
import { CreatePuntoDto } from './dto/create-punto.dto';
import { UpdatePuntoDto } from './dto/update-punto.dto';
import { todayIsoDate } from '../common/audit/audit.util';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Injectable()
export class PuntosService {
  constructor(
    private readonly puntosRepository: PuntosRepository,
    private readonly publicadoresRepository: PublicadoresRepository,
  ) {}

  findAll() {
    return this.puntosRepository.findAll();
  }

  /** Puntos a cargo del publicador autenticado (por coincidencia de móvil), para que
   * pueda ver su propio calendario desde la vista de participante. */
  async findMisPuntos(user: AuthenticatedUser) {
    if (!user.publicadorId) {
      return [];
    }
    const publicador = await this.publicadoresRepository.findById(
      user.publicadorId,
    );
    const movil = publicador?.movil?.trim();
    if (!movil) {
      return [];
    }
    return this.puntosRepository.findByMovil(movil);
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
