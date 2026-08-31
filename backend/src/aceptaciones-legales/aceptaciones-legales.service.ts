import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AceptacionesLegalesRepository } from './aceptaciones-legales.repository';
import { TextosLegalesService } from '../textos-legales/textos-legales.service';
import { todayIsoDateBogota } from '../common/audit/audit.util';

/** Único tipo de texto legal que existe por ahora; la tabla admite agregar más a
 * futuro (términos y condiciones, política de cookies, etc.) sin cambios de esquema. */
export const TIPO_TRATAMIENTO_DATOS = 'TRATAMIENTO_DATOS_PERSONALES';

@Injectable()
export class AceptacionesLegalesService {
  constructor(
    private readonly aceptacionesLegalesRepository: AceptacionesLegalesRepository,
    private readonly textosLegalesService: TextosLegalesService,
  ) {}

  /** Si no hay un texto legal activo configurado para este tipo (el admin todavía no
   * lo ha publicado), no se exige nada — evita bloquear a todos los publicadores por
   * un aviso que aún no existe. */
  async requiereAceptacion(
    publicadorId: string | null | undefined,
    tipo: string,
  ): Promise<boolean> {
    if (!publicadorId) {
      return false;
    }
    const activo = await this.textosLegalesService.obtenerActivo(tipo);
    if (!activo) {
      return false;
    }
    const yaAcepto = await this.aceptacionesLegalesRepository.existeAceptacion(
      publicadorId,
      activo.id,
    );
    return !yaAcepto;
  }

  async aceptar(
    publicadorId: string | null | undefined,
    tipo: string,
    usuarioLogin: string,
  ): Promise<{ mensaje: string }> {
    if (!publicadorId) {
      throw new ForbiddenException(
        'Debes ingresar como participante para registrar esta aceptación.',
      );
    }
    const activo = await this.textosLegalesService.obtenerActivo(tipo);
    if (!activo) {
      throw new NotFoundException('No hay un texto legal vigente para aceptar.');
    }

    const hoy = todayIsoDateBogota();
    await this.aceptacionesLegalesRepository.create({
      id_publicador: publicadorId,
      id_texto_legal: activo.id,
      aceptado: true,
      fecha_aceptacion: hoy,
      usuario_registra: usuarioLogin,
      fecha_registro: hoy,
    });

    return { mensaje: 'Tu aceptación fue registrada correctamente.' };
  }
}
