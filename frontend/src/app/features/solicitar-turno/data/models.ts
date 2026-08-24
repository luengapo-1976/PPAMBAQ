export type TurnoDisponibilidad = 'ocupado' | 'disponible' | 'disponible_hermano' | 'disponible_hermana';

export interface TurnoResumen {
  id: string;
  codigo_punto: number;
  dia_numero: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  id_publicador: string | null;
  sexo_ocupante: string | null;
  disponibilidad: TurnoDisponibilidad;
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
