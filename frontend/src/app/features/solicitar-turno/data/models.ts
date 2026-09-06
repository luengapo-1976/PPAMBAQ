export type TurnoDisponibilidad =
  'ocupado' | 'disponible' | 'disponible_hermano' | 'disponible_hermana';

export type EstadoTurno = 'ACTIVO' | 'INACTIVO';

export interface TurnoResumen {
  id: string;
  codigo_punto: number;
  dia_numero: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  id_publicador: string | null;
  estado_turno: EstadoTurno | null;
  sexo_ocupante: string | null;
  disponibilidad: TurnoDisponibilidad;
  nombreOcupante: string | null;
  /** Solo primer nombre + primer apellido — usado en el calendario del punto (grilla y
   * PDF), donde el espacio por columna es reducido. */
  nombreCortoOcupante: string | null;
  movilOcupante: string | null;
  congregacionOcupante: string | null;
}

export const DIAS_SEMANA_HORARIO = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

export interface CrearTurnoPayload {
  codigo_punto: number;
  dia_nombre: (typeof DIAS_SEMANA_HORARIO)[number];
  hora_inicio: string;
  hora_fin: string;
}

export type SolicitarTurnoOutcome = 'aprobado' | 'requiere_justificacion' | 'pendiente';

export interface SolicitarTurnoResultado {
  outcome: SolicitarTurnoOutcome;
  mensaje: string;
}

export interface MiTurnoResumen {
  id: string;
  nombrePunto: string;
  diaNombre: string;
  horaInicio: string;
  horaFin: string;
  estadoSolicitud: string | null;
  estadoTurno: EstadoTurno | null;
}

export interface ConteoTurnosPublicador {
  solicitados: number;
  maximo: number;
  turnos: MiTurnoResumen[];
}

export const MOTIVOS_DEVOLUCION = [
  'Ocupado (mis circunstancias han cambiado)',
  'Salud (enfermedad, cirugía, etc.)',
  'Temporal (asignación, viaje, etc.)',
  'Traslado (me mudé)',
  'Cambio de Punto',
  'Otro',
] as const;

export type MotivoDevolucion = (typeof MOTIVOS_DEVOLUCION)[number];

export interface DevolverTurnoPayload {
  motivo: MotivoDevolucion;
  motivoOtro?: string;
  observaciones?: string;
}

export interface DevolverTurnoResultado {
  mensaje: string;
}

export type RespuestaSiNo = 'SI' | 'NO';

export interface ReportarActividadPayload {
  fechaActividad: string;
  cumplioTurno: RespuestaSiNo;
  inicioConversacion?: RespuestaSiNo;
  arreglosCurso?: RespuestaSiNo;
  observaciones?: string;
}

export interface DisponibilidadActividad {
  disponible: boolean;
  mensaje?: string;
}

export interface ReportarActividadResultado {
  mensaje: string;
}

export interface ActividadHistorialItem {
  fechaActividad: string;
  cumplioTurno: RespuestaSiNo | null;
  inicioConversacion: RespuestaSiNo | null;
  arreglosCurso: RespuestaSiNo | null;
  observaciones: string | null;
  registradoPor: string;
}

export type TurnoHistorialTipo = 'solicitado' | 'rechazado' | 'devuelto';

export interface TurnoHistorialItem {
  tipo: TurnoHistorialTipo;
  fecha: string | null;
  nombrePunto: string;
  diaNombre: string;
  horaInicio: string;
  horaFin: string;
  justificacion: string | null;
  motivo: string | null;
  observacion: string | null;
}
