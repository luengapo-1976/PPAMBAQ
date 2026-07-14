import { Injectable } from '@nestjs/common';
import { PublicadoresRepository } from './publicadores.repository';
import { CreatePublicadorDto } from './dto/create-publicador.dto';
import { UpdatePublicadorDto } from './dto/update-publicador.dto';
import { CURRENT_USER_LOGIN, todayIsoDate } from '../common/audit/audit.util';

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

  async create(dto: CreatePublicadorDto) {
    const login = await this.buildUniqueLogin(dto.primer_nombre, dto.primer_apellido);
    const row = await this.publicadoresRepository.create({
      ...dto,
      login,
      usuario_registra: CURRENT_USER_LOGIN,
      fecha_registro: todayIsoDate(),
    });
    return flatten(row as unknown as PublicadorRow);
  }

  async update(id: string, dto: UpdatePublicadorDto) {
    const row = await this.publicadoresRepository.update(id, {
      ...dto,
      usuario_modifica: CURRENT_USER_LOGIN,
      fecha_modificacion: todayIsoDate(),
    });
    return flatten(row as unknown as PublicadorRow);
  }

  async notificarEntrenamiento(ids: string[]) {
    const rows = await this.publicadoresRepository.findEstadoByIds(ids);
    const today = todayIsoDate();

    const idsRegistrado = rows.filter((r) => r.estado === 'REGISTRADO').map((r) => r.id);
    const idsNotificadoPrimero = rows
      .filter((r) => r.estado === 'NOTIFICADO PRIMER ENTRENAMIENTO')
      .map((r) => r.id);

    await this.publicadoresRepository.bulkUpdateByIds(idsRegistrado, 'REGISTRADO', {
      estado: 'NOTIFICADO PRIMER ENTRENAMIENTO',
      mensaje_primer_entrenamiento: today,
      entrenamiento_requerido: 'Segundo entrenamiento',
      usuario_modifica: CURRENT_USER_LOGIN,
      fecha_modificacion: today,
    });

    await this.publicadoresRepository.bulkUpdateByIds(
      idsNotificadoPrimero,
      'NOTIFICADO PRIMER ENTRENAMIENTO',
      {
        estado: 'NOTIFICADO SEGUNDO ENTRENAMIENTO',
        mensaje_segundo_entrenamiento: today,
        usuario_modifica: CURRENT_USER_LOGIN,
        fecha_modificacion: today,
      },
    );

    return { actualizados: idsRegistrado.length + idsNotificadoPrimero.length };
  }

  /** login = primer_nombre + primer_apellido en minúsculas; si ya existe en
   * publicadores.login, se le agrega un sufijo aleatorio de 2 dígitos (10-99). */
  private async buildUniqueLogin(primerNombre: string, primerApellido: string): Promise<string> {
    const base = `${primerNombre}${primerApellido}`.toLowerCase().trim();
    const alreadyExists = await this.publicadoresRepository.existsByLogin(base);
    if (!alreadyExists) {
      return base;
    }
    const suffix = Math.floor(Math.random() * 90) + 10;
    return `${base}${suffix}`;
  }
}
