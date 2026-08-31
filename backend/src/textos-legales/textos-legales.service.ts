import { Injectable, NotFoundException } from '@nestjs/common';
import { TextosLegalesRepository, TextoLegalRow } from './textos-legales.repository';
import { CreateTextoLegalDto } from './dto/create-texto-legal.dto';
import { todayIsoDateBogota } from '../common/audit/audit.util';

@Injectable()
export class TextosLegalesService {
  constructor(private readonly textosLegalesRepository: TextosLegalesRepository) {}

  async listar(tipo: string): Promise<TextoLegalRow[]> {
    return this.textosLegalesRepository.findAllByTipo(tipo);
  }

  async obtenerActivo(tipo: string): Promise<TextoLegalRow | null> {
    return this.textosLegalesRepository.findActivoByTipo(tipo);
  }

  /** Cada guardado crea una versión nueva (nunca sobrescribe una existente), para que
   * quede un historial completo de qué texto exacto estuvo vigente en cada momento —
   * necesario para poder sustentar el consentimiento que cada publicador ya haya dado
   * sobre una versión anterior. Solo se desactivan las demás versiones cuando esta se
   * guarda como publicada (dto.activo): guardar sin publicar deja intacta la versión
   * vigente actual (si la hay), permitiendo dejar un borrador sin afectar a nadie. */
  async crearVersion(
    tipo: string,
    dto: CreateTextoLegalDto,
    usuarioLogin: string,
  ): Promise<TextoLegalRow> {
    const hoy = todayIsoDateBogota();
    if (dto.activo) {
      await this.textosLegalesRepository.desactivarTodas(tipo, {
        activo: false,
        usuario_registra: usuarioLogin,
      });
    }

    return this.textosLegalesRepository.create({
      tipo,
      version: new Date().toISOString(),
      contenido: dto.contenido,
      activo: dto.activo,
      usuario_registra: usuarioLogin,
      fecha_registro: hoy,
    });
  }

  /** Publica o despublica una versión ya guardada, sin crear una versión nueva ni
   * tocar su contenido — el switch de "Textos legales" llama esto directamente al
   * cambiar de posición. Al publicar (activo=true) se desactivan las demás versiones
   * de ese mismo tipo, para mantener una sola vigente a la vez. */
  async actualizarEstado(id: string, activo: boolean): Promise<TextoLegalRow> {
    const texto = await this.textosLegalesRepository.findById(id);
    if (!texto) {
      throw new NotFoundException('El texto legal indicado no existe.');
    }

    if (activo) {
      await this.textosLegalesRepository.desactivarTodas(texto.tipo, { activo: false });
    }

    const actualizado = await this.textosLegalesRepository.updateActivo(id, activo);
    if (!actualizado) {
      throw new NotFoundException('El texto legal indicado no existe.');
    }
    return actualizado;
  }
}
