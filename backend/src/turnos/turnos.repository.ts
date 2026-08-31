import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

const SELECT_WITH_SEXO =
  '*, publicadores(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, sexo, movil, congregaciones(nombre_congregacion))';
const SELECT_VALIDACION =
  '*, puntos(nombre_punto), publicadores(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, fecha_nacimiento, sexo, estado_civil, nombre_conyuge, movil)';

export interface TurnoConSexo {
  id: string;
  codigo_punto: number;
  dia_numero: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  id_publicador: string | null;
  estado_solicitud: string | null;
  estado_turno: string | null;
  justificacion: string | null;
  situacion_identificada: string | null;
  observaciones: string | null;
  pareja_nombre: string | null;
  pareja_movil: string | null;
  usuario_registra: string | null;
  fecha_registro: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
  publicadores: {
    primer_nombre: string | null;
    segundo_nombre: string | null;
    primer_apellido: string | null;
    segundo_apellido: string | null;
    sexo: string | null;
    movil: string | null;
    congregaciones: { nombre_congregacion: string | null } | null;
  } | null;
}

export interface TurnoConPunto {
  id: string;
  dia_numero: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  estado_solicitud: string | null;
  estado_turno: string | null;
  puntos: { nombre_punto: string } | null;
}

export interface TurnoSolicitadoHistorial {
  id: string;
  dia_numero: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  justificacion: string | null;
  fecha_modificacion: string | null;
  puntos: { nombre_punto: string } | null;
}

export interface TurnoApRechazHistorial {
  id: string;
  dia_numero: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  estado_solicitud: string | null;
  justificacion: string | null;
  justificacion_aprobacion: string | null;
  justificacion_solicitud: string | null;
  fecha_modificacion: string | null;
  fecha_aprobacion: string | null;
  puntos: { nombre_punto: string } | null;
}

export interface TurnoRow {
  id: string;
  codigo_punto: number;
  dia_numero: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  id_publicador: string | null;
  estado_solicitud: string | null;
  justificacion: string | null;
  situacion_identificada: string | null;
  observaciones: string | null;
  pareja_nombre: string | null;
  pareja_movil: string | null;
  usuario_registra: string | null;
  fecha_registro: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
  aprobado_por: string | null;
  justificacion_aprobacion: string | null;
  fecha_aprobacion: string | null;
}

export interface TurnoValidacion {
  id: string;
  codigo_punto: number;
  dia_numero: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  justificacion: string | null;
  situacion_identificada: string | null;
  pareja_nombre: string | null;
  pareja_movil: string | null;
  fecha_modificacion: string | null;
  aprobado_por: string | null;
  justificacion_aprobacion: string | null;
  fecha_aprobacion: string | null;
  puntos: { nombre_punto: string } | null;
  publicadores: {
    primer_nombre: string | null;
    segundo_nombre: string | null;
    primer_apellido: string | null;
    segundo_apellido: string | null;
    fecha_nacimiento: string | null;
    sexo: string | null;
    estado_civil: string | null;
    nombre_conyuge: string | null;
    movil: string | null;
  } | null;
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
      throw new InternalServerErrorException(
        'No se pudo obtener los horarios del punto.',
      );
    }

    return data ?? [];
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

    return data;
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
      throw new InternalServerErrorException(
        'No se pudo consultar el turno relacionado.',
      );
    }

    return data;
  }

  /** Turnos asignados al publicador (aprobados o pendientes), sin importar el punto:
   * el límite de turnos por publicador aplica en toda la app, no por punto. Incluye el
   * nombre del punto (join por FK) para poder listarlos sin consultas adicionales. */
  async findByPublicador(publicadorId: string): Promise<TurnoConPunto[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .select(
        'id, dia_numero, dia_nombre, hora_inicio, hora_fin, estado_solicitud, estado_turno, puntos(nombre_punto)',
      )
      .eq('id_publicador', publicadorId)
      .order('dia_numero', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo consultar tus turnos solicitados.',
      );
    }

    return data ?? [];
  }

  /** Turnos actualmente asignados o pendientes al publicador, con la justificación y la
   * fecha de la solicitud — usado para el evento "Solicitado" de la línea de tiempo en
   * "Editar solicitud". No filtra por estado_solicitud a propósito: un turno rechazado o
   * devuelto ya no tiene id_publicador (quedó libre), así que esta consulta solo puede
   * ver los que siguen asignados/pendientes; el resto del historial viene de
   * findApRechazPorPublicador. */
  async findSolicitadosPorPublicador(
    publicadorId: string,
  ): Promise<TurnoSolicitadoHistorial[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .select(
        'id, dia_numero, dia_nombre, hora_inicio, hora_fin, justificacion, fecha_modificacion, puntos(nombre_punto)',
      )
      .eq('id_publicador', publicadorId);

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo consultar el historial de solicitudes.',
      );
    }

    return data ?? [];
  }

  /** Copias de solicitudes ya resueltas manualmente (rechazadas) o devueltas, para el
   * mismo histórico de línea de tiempo. Se excluyen las APROBADO: esas siguen visibles en
   * turnos (findSolicitadosPorPublicador) y no aportan un evento distinto. */
  async findApRechazPorPublicador(
    publicadorId: string,
  ): Promise<TurnoApRechazHistorial[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos_apro_rechaz')
      .select(
        'id, dia_numero, dia_nombre, hora_inicio, hora_fin, estado_solicitud, justificacion, justificacion_aprobacion, justificacion_solicitud, fecha_modificacion, fecha_aprobacion, puntos(nombre_punto)',
      )
      .eq('id_publicador', publicadorId)
      .neq('estado_solicitud', 'APROBADO');

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo consultar el historial de solicitudes.',
      );
    }

    return data ?? [];
  }

  /** Crea un nuevo horario (cupo) para un punto, usado por "Habilitar nuevo horario"
   * en el calendario de Puntos. */
  async crear(payload: TablesInsert<'turnos'>): Promise<TurnoConSexo> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .insert(payload)
      .select(SELECT_WITH_SEXO)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo crear el nuevo horario.',
      );
    }

    return data;
  }

  /** Activa o inactiva un horario ya existente, sin condicionar a su estado actual
   * (a diferencia de asignarSiLibre/liberarSiEsDelPublicador, aquí no hay condición de
   * carrera que evitar: es una acción administrativa directa sobre un turno puntual). */
  async actualizarEstado(
    id: string,
    payload: TablesUpdate<'turnos'>,
  ): Promise<TurnoConSexo | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .update(payload)
      .eq('id', id)
      .select(SELECT_WITH_SEXO)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo actualizar el estado del horario.',
      );
    }

    return data;
  }

  /** Update condicionado a que el turno siga libre (id_publicador IS NULL), para evitar
   * una condición de carrera si dos publicadores solicitan el mismo turno a la vez. */
  async asignarSiLibre(
    id: string,
    payload: TablesUpdate<'turnos'>,
  ): Promise<TurnoConSexo | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .update(payload)
      .eq('id', id)
      .is('id_publicador', null)
      .select(SELECT_WITH_SEXO)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo registrar la solicitud del turno.',
      );
    }

    return data;
  }

  /** Update condicionado a que el turno siga asignado a este publicador, para evitar
   * liberar (o registrar como entregado) un turno que ya no le pertenece. */
  async liberarSiEsDelPublicador(
    id: string,
    publicadorId: string,
    payload: TablesUpdate<'turnos'>,
  ): Promise<boolean> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .update(payload)
      .eq('id', id)
      .eq('id_publicador', publicadorId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo liberar el turno.');
    }

    return !!data;
  }

  /** Libera TODOS los turnos asignados a un publicador (sin condicionar a un id
   * puntual), usado al procesar una solicitud de baja. */
  async liberarTodosDelPublicador(
    publicadorId: string,
    payload: TablesUpdate<'turnos'>,
  ): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .update(payload)
      .eq('id_publicador', publicadorId);

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo liberar tus turnos asignados.',
      );
    }
  }

  async registrarEntrega(
    payload: TablesInsert<'turnos_entregados'>,
  ): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('turnos_entregados')
      .insert(payload);

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo registrar la devolución del turno.',
      );
    }
  }

  /** Busca si ya existe un reporte de actividad para esa fecha, en cualquiera de los
   * turnos indicados (típicamente el turno propio + su pareja): los dos cupos de un
   * mismo punto+día+hora comparten la misma actividad, así que basta con que uno de
   * los dos publicadores la haya reportado. */
  async findActividadPorTurnosYFecha(
    turnoIds: string[],
    fechaActividad: string,
  ): Promise<{ usuario_registra: string | null } | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('actividad_reportada')
      .select('usuario_registra')
      .in('id_turno', turnoIds)
      .eq('fecha_actividad', fechaActividad)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo verificar si la actividad ya fue reportada.',
      );
    }

    return data;
  }

  async registrarActividad(
    payload: TablesInsert<'actividad_reportada'>,
  ): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('actividad_reportada')
      .insert(payload);

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo registrar el reporte de actividad.',
      );
    }
  }

  /** Todos los turnos (normalmente los 2 cupos, uno por sexo) de un mismo
   * punto+día+hora, para traer el histórico completo del horario sin importar
   * cuál de los dos cupos reportó cada registro. */
  async findIdsPorPuntoDiaHora(
    codigoPunto: number,
    diaNombre: string,
    horaInicio: string,
    horaFin: string,
  ): Promise<string[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .select('id')
      .eq('codigo_punto', codigoPunto)
      .eq('dia_nombre', diaNombre)
      .eq('hora_inicio', horaInicio)
      .eq('hora_fin', horaFin);

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo consultar los turnos de este horario.',
      );
    }

    return (data ?? []).map((turno) => turno.id);
  }

  /** Turnos solicitados que incumplieron alguna regla de aprobación automática
   * (conflicto de sexo con la pareja) y quedaron a la espera de revisión manual. */
  async findPendientesValidacion(): Promise<TurnoValidacion[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .select(SELECT_VALIDACION)
      .eq('estado_solicitud', 'PENDIENTE')
      .order('fecha_modificacion', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo consultar los casos pendientes por validar.',
      );
    }

    return data ?? [];
  }

  /** Histórico de casos que pasaron por esta revisión manual (se distingue de la
   * aprobación automática porque solo estos tienen aprobado_por). */
  async findAprobadosValidacion(): Promise<TurnoValidacion[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .select(SELECT_VALIDACION)
      .eq('estado_solicitud', 'APROBADO')
      .not('aprobado_por', 'is', null)
      .order('fecha_aprobacion', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo consultar el histórico de casos aprobados.',
      );
    }

    return data ?? [];
  }

  /** Update condicionado a que el turno siga PENDIENTE, para evitar aprobarlo dos veces.
   * Devuelve la fila completa (no solo el id) porque el servicio necesita copiarla, ya
   * actualizada, a turnos_apro_rechaz. */
  async aprobarSolicitud(
    id: string,
    payload: TablesUpdate<'turnos'>,
  ): Promise<TurnoRow | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .update(payload)
      .eq('id', id)
      .eq('estado_solicitud', 'PENDIENTE')
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo aprobar la solicitud.',
      );
    }

    return data;
  }

  /** Histórico de casos rechazados manualmente. A diferencia de los aprobados, el turno
   * rechazado se libera (vuelve a quedar disponible en la tabla turnos, misma lógica que
   * una devolución) — por eso el histórico de rechazos vive aparte, en turnos_apro_rechaz,
   * y no se puede leer consultando turnos por estado_solicitud = 'RECHAZADO'. */
  async findRechazadosValidacion(): Promise<TurnoValidacion[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos_apro_rechaz')
      .select(SELECT_VALIDACION)
      .eq('estado_solicitud', 'RECHAZADO')
      .order('fecha_aprobacion', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo consultar el histórico de casos rechazados.',
      );
    }

    return data ?? [];
  }

  /** Copia de auditoría de una solicitud ya procesada (aprobada, rechazada o devuelta),
   * usada por Casos por validar, Retirar/Devolver turno y sus equivalentes. */
  async registrarApRechaz(
    payload: TablesInsert<'turnos_apro_rechaz'>,
  ): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('turnos_apro_rechaz')
      .insert(payload);

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo registrar el histórico de la solicitud.',
      );
    }
  }

  /** Update condicionado a que el turno siga PENDIENTE, para evitar rechazarlo dos veces.
   * El payload que envía el servicio no marca el turno como RECHAZADO: lo libera (mismos
   * campos que una devolución), porque el histórico de la decisión se guarda aparte en
   * turnos_apro_rechaz. */
  async rechazarSolicitud(
    id: string,
    payload: TablesUpdate<'turnos'>,
  ): Promise<boolean> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('turnos')
      .update(payload)
      .eq('id', id)
      .eq('estado_solicitud', 'PENDIENTE')
      .select('id')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo rechazar la solicitud.',
      );
    }

    return !!data;
  }

  async findActividadesPorTurnos(
    turnoIds: string[],
  ): Promise<ActividadHistorial[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('actividad_reportada')
      .select(
        'id, fecha_actividad, cumplio_turno, inicio_conversacion, arreglos_curso, observaciones, usuario_registra',
      )
      .in('id_turno', turnoIds)
      .order('fecha_actividad', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo consultar el histórico de actividad.',
      );
    }

    return data ?? [];
  }
}

export interface ActividadHistorial {
  id: string;
  fecha_actividad: string;
  cumplio_turno: string | null;
  inicio_conversacion: string | null;
  arreglos_curso: string | null;
  observaciones: string | null;
  usuario_registra: string | null;
}
