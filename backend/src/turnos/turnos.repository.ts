import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesUpdate } from '../supabase/database.types';

const SELECT_WITH_SEXO = '*, publicadores(sexo)';

export interface TurnoConSexo {
  id: string;
  codigo_punto: number;
  dia_numero: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  id_publicador: string | null;
  estado_solicitud: string | null;
  justificacion: string | null;
  observaciones: string | null;
  usuario_registra: string | null;
  fecha_registro: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
  publicadores: { sexo: string | null } | null;
}

export interface TurnoConPunto {
  id: string;
  dia_numero: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  puntos: { nombre_punto: string } | null;
}

@Injectable()
export class TurnosRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findByCodigoPunto(codigoPunto: number): Promise<TurnoConSexo[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .select(SELECT_WITH_SEXO)
      .eq('codigo_punto', codigoPunto)
      .order('dia_numero', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener los horarios del punto.');
    }

    return (data ?? []) as unknown as TurnoConSexo[];
  }

  async findById(id: string): Promise<TurnoConSexo | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .select(SELECT_WITH_SEXO)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar el turno.');
    }

    return data as unknown as TurnoConSexo | null;
  }

  /** Turno "pareja": misma combinación punto+día+hora, distinta fila. Se asume que cada
   * combinación tiene exactamente 2 filas (una por sexo); si hubiera más de una
   * coincidencia (dato atípico) se toma la primera. */
  async findPareja(
    codigoPunto: number,
    diaNumero: number,
    horaInicio: string,
    horaFin: string,
    excludeId: string,
  ): Promise<TurnoConSexo | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .select(SELECT_WITH_SEXO)
      .eq('codigo_punto', codigoPunto)
      .eq('dia_numero', diaNumero)
      .eq('hora_inicio', horaInicio)
      .eq('hora_fin', horaFin)
      .neq('id', excludeId)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar el turno relacionado.');
    }

    return data as unknown as TurnoConSexo | null;
  }

  /** Turnos asignados al publicador (aprobados o pendientes), sin importar el punto:
   * el límite de turnos por publicador aplica en toda la app, no por punto. Incluye el
   * nombre del punto (join por FK) para poder listarlos sin consultas adicionales. */
  async findByPublicador(publicadorId: string): Promise<TurnoConPunto[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .select('id, dia_numero, dia_nombre, hora_inicio, hora_fin, puntos(nombre_punto)')
      .eq('id_publicador', publicadorId)
      .order('dia_numero', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar tus turnos solicitados.');
    }

    return (data ?? []) as unknown as TurnoConPunto[];
  }

  /** Update condicionado a que el turno siga libre (id_publicador IS NULL), para evitar
   * una condición de carrera si dos publicadores solicitan el mismo turno a la vez. */
  async asignarSiLibre(id: string, payload: TablesUpdate<'turnos'>): Promise<TurnoConSexo | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .update(payload)
      .eq('id', id)
      .is('id_publicador', null)
      .select(SELECT_WITH_SEXO)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo registrar la solicitud del turno.');
    }

    return data as unknown as TurnoConSexo | null;
  }
}
