import { Injectable, NotFoundException } from '@nestjs/common';
import { ParametrosRepository, ParametroRow } from './parametros.repository';
import { UpdateParametroDto } from './dto/update-parametro.dto';
import { todayIsoDateBogota } from '../common/audit/audit.util';

/** Clave del único parámetro que existe por ahora. La tabla está pensada para admitir
 * más parámetros a futuro (cada uno, una fila nueva), sin cambios de esquema. */
export const CLAVE_ACTUALIZACION_DATOS_MESES = 'ACTUALIZACION_DATOS_MESES';

@Injectable()
export class ParametrosService {
  constructor(private readonly parametrosRepository: ParametrosRepository) {}

  async listar(): Promise<ParametroRow[]> {
    return this.parametrosRepository.findAll();
  }

  async actualizar(
    clave: string,
    dto: UpdateParametroDto,
    usuarioLogin: string,
  ): Promise<ParametroRow> {
    const actualizado = await this.parametrosRepository.updateByClave(clave, {
      valor: dto.valor ?? null,
      activo: dto.activo,
      usuario_modifica: usuarioLogin,
      fecha_modificacion: todayIsoDateBogota(),
    });
    if (!actualizado) {
      throw new NotFoundException('El parámetro indicado no existe.');
    }
    return actualizado;
  }

  /** Determina si, al iniciar sesión, se le debe exigir a este publicador actualizar
   * sus datos: el parámetro debe estar activo y con un número de meses válido, y la
   * última actualización (o su ausencia) debe superar ese umbral. Un publicador que
   * nunca ha confirmado sus datos (fecha null) siempre requiere actualización mientras
   * el parámetro esté activo — no hay una fecha de referencia más confiable que esa. */
  async requiereActualizacionDatos(fechaActualizacionDatos: string | null): Promise<boolean> {
    const parametro = await this.parametrosRepository.findByClave(
      CLAVE_ACTUALIZACION_DATOS_MESES,
    );
    if (!parametro?.activo || !parametro.valor) {
      return false;
    }
    const meses = Number(parametro.valor);
    if (!Number.isFinite(meses) || meses <= 0) {
      return false;
    }
    if (!fechaActualizacionDatos) {
      return true;
    }

    const [anio, mes, dia] = fechaActualizacionDatos.split('-').map(Number);
    const limite = new Date(Date.UTC(anio, mes - 1 + meses, dia));
    const hoy = new Date(`${todayIsoDateBogota()}T00:00:00Z`);
    return hoy >= limite;
  }
}
