import { Injectable } from '@nestjs/common';
import { PublicadoresRepository } from './publicadores.repository';
import { CreatePublicadorDto } from './dto/create-publicador.dto';
import { UpdatePublicadorDto } from './dto/update-publicador.dto';
import { MensajeRelacionadoCon } from './dto/notificar-entrenamiento.dto';
import { AsignarLugarEntrenamientoDto, TipoEntrenamiento } from './dto/asignar-lugar-entrenamiento.dto';
import { todayIsoDate } from '../common/audit/audit.util';

interface CongregacionEmbed {
  nombre_congregacion: string;
  codigo_circuito: string | null;
}

interface PublicadorRow {
  congregaciones: CongregacionEmbed | CongregacionEmbed[] | null;
  [key: string]: unknown;
}

function flatten(row: PublicadorRow) {
  const { congregaciones, ...rest } = row;
  const congregacion = Array.isArray(congregaciones) ? congregaciones[0] : congregaciones;

  return {
    ...rest,
    nombre_congregacion: congregacion?.nombre_congregacion ?? null,
    codigo_circuito: congregacion?.codigo_circuito ?? null,
  };
}

@Injectable()
export class PublicadoresService {
  constructor(private readonly publicadoresRepository: PublicadoresRepository) {}

  async findAll() {
    const rows = await this.publicadoresRepository.findAll();
    return (rows as unknown as PublicadorRow[]).map(flatten);
  }

  async create(dto: CreatePublicadorDto, usuarioLogin: string) {
    const login = await this.buildUniqueLogin(dto.primer_nombre, dto.primer_apellido, dto.segundo_apellido);
    const row = await this.publicadoresRepository.create({
      ...dto,
      login,
      existe_bd_anterior: 'NO',
      asistio_primera_capacitacion: 'NO',
      asistio_segunda_capacitacion: 'NO',
      usuario_registra: usuarioLogin,
      fecha_registro: todayIsoDate(),
    });
    return flatten(row as unknown as PublicadorRow);
  }

  async update(id: string, dto: UpdatePublicadorDto, usuarioLogin: string) {
    const row = await this.publicadoresRepository.update(id, {
      ...dto,
      usuario_modifica: usuarioLogin,
      fecha_modificacion: todayIsoDate(),
    });
    return flatten(row as unknown as PublicadorRow);
  }

  async notificarEntrenamiento(ids: string[], mensajeRelacionadoCon: MensajeRelacionadoCon, usuarioLogin: string) {
    if (mensajeRelacionadoCon === 'otro') {
      return { actualizados: 0 };
    }

    const today = todayIsoDate();
    const esPrimero = mensajeRelacionadoCon === 'Primer entrenamiento';

    await this.publicadoresRepository.bulkUpdateByIds(ids, {
      estado: esPrimero ? 'NOTIFICADO PRIMER ENTRENAMIENTO' : 'NOTIFICADO SEGUNDO ENTRENAMIENTO',
      entrenamiento_requerido: mensajeRelacionadoCon,
      ...(esPrimero ? { mensaje_primer_entrenamiento: today } : { mensaje_segundo_entrenamiento: today }),
      usuario_modifica: usuarioLogin,
      fecha_modificacion: today,
    });

    return { actualizados: ids.length };
  }

  async asignarLugarEntrenamiento(dto: AsignarLugarEntrenamientoDto, usuarioLogin: string) {
    const esPrimero = dto.tipoEntrenamiento === 'Primer entrenamiento';

    await this.publicadoresRepository.bulkUpdateByIds(dto.ids, {
      ...(esPrimero
        ? { fecha_primera_capacitacion: dto.fecha, lugar_primera_capacitacion: dto.codigoPunto }
        : { fecha_segunda_capacitacion: dto.fecha, lugar_segunda_capacitacion: dto.codigoPunto }),
      usuario_modifica: usuarioLogin,
      fecha_modificacion: todayIsoDate(),
    });

    return { actualizados: dto.ids.length };
  }

  async quitarLugarEntrenamiento(ids: string[], usuarioLogin: string) {
    const audit = { usuario_modifica: usuarioLogin, fecha_modificacion: todayIsoDate() };

    await this.publicadoresRepository.bulkUpdateByIdsAndEntrenamiento(ids, 'Primer entrenamiento', {
      fecha_primera_capacitacion: null,
      lugar_primera_capacitacion: null,
      estado: 'REGISTRADO',
      ...audit,
    });

    await this.publicadoresRepository.bulkUpdateByIdsAndEntrenamiento(ids, 'Segundo entrenamiento', {
      fecha_segunda_capacitacion: null,
      lugar_segunda_capacitacion: null,
      estado: 'NOTIFICADO PRIMER ENTRENAMIENTO',
      ...audit,
    });

    return { actualizados: ids.length };
  }

  async confirmarAsistencia(ids: string[], tipoEntrenamiento: TipoEntrenamiento, usuarioLogin: string) {
    const today = todayIsoDate();
    const audit = { usuario_modifica: usuarioLogin, fecha_modificacion: today };

    if (tipoEntrenamiento === 'Primer entrenamiento') {
      await this.publicadoresRepository.bulkUpdateByIds(ids, {
        asistio_primera_capacitacion: 'SI',
        entrenamiento_requerido: 'Segundo entrenamiento',
        ...audit,
      });
      return { actualizados: ids.length };
    }

    // Al completar el segundo entrenamiento la solicitud "Cumple requisitos"; se replica la
    // misma convención usada al editar manualmente entrenamiento_requerido a ese valor: se
    // completa fecha_cumple_requisitos y, si aún no existía, también fecha_aprobacion.
    const rows = await this.publicadoresRepository.findFechaAprobacionByIds(ids);
    const idsSinAprobacion = rows.filter((row) => !row.fecha_aprobacion).map((row) => row.id);
    const idsConAprobacion = rows.filter((row) => row.fecha_aprobacion).map((row) => row.id);

    const base = {
      asistio_segunda_capacitacion: 'SI',
      entrenamiento_requerido: 'Entrenamiento completado',
      estado: 'CUMPLE REQUISITOS',
      fecha_cumple_requisitos: today,
      ...audit,
    };

    await this.publicadoresRepository.bulkUpdateByIds(idsSinAprobacion, { ...base, fecha_aprobacion: today });
    await this.publicadoresRepository.bulkUpdateByIds(idsConAprobacion, base);

    return { actualizados: ids.length };
  }

  /** Solo puede desmarcar la asistencia el mismo usuario que la había confirmado
   * (usuario_modifica actual del registro); los ids que no cumplan se ignoran. */
  async revertirAsistencia(ids: string[], tipoEntrenamiento: TipoEntrenamiento, usuarioLogin: string) {
    const rows = await this.publicadoresRepository.findUsuarioModificaByIds(ids);
    const autorizados = rows.filter((row) => row.usuario_modifica === usuarioLogin).map((row) => row.id);

    if (autorizados.length === 0) {
      return { actualizados: 0 };
    }

    const audit = { usuario_modifica: usuarioLogin, fecha_modificacion: todayIsoDate() };

    if (tipoEntrenamiento === 'Primer entrenamiento') {
      await this.publicadoresRepository.bulkUpdateByIds(autorizados, {
        asistio_primera_capacitacion: 'NO',
        entrenamiento_requerido: 'Primer entrenamiento',
        ...audit,
      });
    } else {
      await this.publicadoresRepository.bulkUpdateByIds(autorizados, {
        asistio_segunda_capacitacion: 'NO',
        entrenamiento_requerido: 'Segundo entrenamiento',
        estado: 'NOTIFICADO SEGUNDO ENTRENAMIENTO',
        ...audit,
      });
    }

    return { actualizados: autorizados.length };
  }

  async marcarExisteBdAnterior(ids: string[], usuarioLogin: string) {
    await this.publicadoresRepository.bulkUpdateByIds(ids, {
      existe_bd_anterior: 'SI',
      usuario_modifica: usuarioLogin,
      fecha_modificacion: todayIsoDate(),
    });

    return { actualizados: ids.length };
  }

  /** login = primer_nombre + primer_apellido en minúsculas. Si ya existe en
   * publicadores.login:
   *  1. Si hay segundo_apellido, se le agrega su primera letra y se vuelve a validar.
   *  2. Si esa combinación también existe (o no había segundo_apellido), se le agrega
   *     un sufijo aleatorio de 2 dígitos (10-99), reintentando con un sufijo nuevo
   *     cada vez que la combinación resultante ya exista, hasta obtener una libre. */
  private async buildUniqueLogin(
    primerNombre: string,
    primerApellido: string,
    segundoApellido?: string | null,
  ): Promise<string> {
    const base = `${primerNombre}${primerApellido}`.toLowerCase().trim();
    if (!(await this.publicadoresRepository.existsByLogin(base))) {
      return base;
    }

    let candidateBase = base;
    const segundo = segundoApellido?.trim();
    if (segundo) {
      const conInicialSegundoApellido = `${base}${segundo.charAt(0).toLowerCase()}`;
      if (!(await this.publicadoresRepository.existsByLogin(conInicialSegundoApellido))) {
        return conInicialSegundoApellido;
      }
      candidateBase = conInicialSegundoApellido;
    }

    for (;;) {
      const suffix = Math.floor(Math.random() * 90) + 10;
      const candidate = `${candidateBase}${suffix}`;
      if (!(await this.publicadoresRepository.existsByLogin(candidate))) {
        return candidate;
      }
    }
  }
}
