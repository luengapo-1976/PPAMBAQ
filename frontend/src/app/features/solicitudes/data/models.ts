export interface Departamento {
  codigo_departamento: string;
  nombre_departamento: string;
}

export interface Municipio {
  codigo_municipio: string;
  nombre_municipio: string;
  codigo_departamento: string;
}

export interface Congregacion {
  codigo_congregacion: number;
  nombre_congregacion: string;
  codigo_circuito: string | null;
  codigo_municipio: string;
  codigo_departamento: string;
}

export type Sexo = 'M' | 'F';
export type EstadoCivil = 'Casado' | 'Soltero' | 'Divorciado' | 'Separado' | 'Viudo';
export type PrivilegioMin = 'Ninguno' | 'Anciano' | 'Siervo ministerial';
export type PrivilegioSer =
  | 'Publicador'
  | 'Precursor regular'
  | 'Precursor especial'
  | 'Misionero que sirve en el campo'
  | 'Miembro de la familia Betel';
export type ParticipoAntes = 'SI' | 'NO';
export type ExisteBdAnterior = 'SI' | 'NO';
export type EstadoSolicitud =
  | 'REGISTRADO'
  | 'NOTIFICADO PRIMER ENTRENAMIENTO'
  | 'NOTIFICADO SEGUNDO ENTRENAMIENTO'
  | 'CUMPLE REQUISITOS';

export const ESTADOS_SOLICITUD: EstadoSolicitud[] = [
  'REGISTRADO',
  'NOTIFICADO PRIMER ENTRENAMIENTO',
  'NOTIFICADO SEGUNDO ENTRENAMIENTO',
  'CUMPLE REQUISITOS',
];

export type EntrenamientoRequerido = 'Primer entrenamiento' | 'Segundo entrenamiento' | 'Entrenamiento completado';

export type MensajeRelacionadoCon = 'Primer entrenamiento' | 'Segundo entrenamiento' | 'otro';

export const MENSAJE_RELACIONADO_CON_OPTIONS: MensajeRelacionadoCon[] = [
  'Primer entrenamiento',
  'Segundo entrenamiento',
  'otro',
];

export const ENTRENAMIENTOS_REQUERIDOS: EntrenamientoRequerido[] = [
  'Primer entrenamiento',
  'Segundo entrenamiento',
  'Entrenamiento completado',
];

export interface Publicador {
  id: string;
  login: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  primer_nombre: string;
  segundo_nombre: string | null;
  direccion: string;
  codigo_departamento: string;
  codigo_municipio: string;
  correo_electronico: string;
  movil: string;
  codigo_congregacion: number;
  nombre_congregacion: string | null;
  codigo_circuito: string | null;
  fecha_nacimiento: string;
  sexo: Sexo;
  fecha_bautismo: string;
  estado_civil: EstadoCivil;
  nombre_conyuge: string | null;
  apellido_casada: string | null;
  privilegio_min: PrivilegioMin;
  privilegio_ser: PrivilegioSer;
  participo_antes: ParticipoAntes;
  fecha_solicitud: string;
  estado: EstadoSolicitud;
  entrenamiento_requerido: EntrenamientoRequerido;
  fecha_aprobacion: string | null;
  fecha_cumple_requisitos: string | null;
  fecha_primera_capacitacion: string | null;
  lugar_primera_capacitacion: number | null;
  fecha_segunda_capacitacion: string | null;
  lugar_segunda_capacitacion: number | null;
  usuario_registra: string | null;
  fecha_registro: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
  existe_bd_anterior: ExisteBdAnterior;
}

export type PublicadorPayload = Omit<
  Publicador,
  | 'id'
  | 'login'
  | 'nombre_congregacion'
  | 'codigo_circuito'
  | 'usuario_registra'
  | 'fecha_registro'
  | 'usuario_modifica'
  | 'fecha_modificacion'
  | 'fecha_aprobacion'
  | 'fecha_cumple_requisitos'
  | 'fecha_primera_capacitacion'
  | 'lugar_primera_capacitacion'
  | 'fecha_segunda_capacitacion'
  | 'lugar_segunda_capacitacion'
> & {
  /** Solo se incluyen en el payload cuando Estado = "CUMPLE REQUISITOS". */
  fecha_aprobacion?: string | null;
  fecha_cumple_requisitos?: string | null;
};

/** Payload de actualización ("Editar solicitud"): a diferencia de PublicadorPayload,
 * todos los campos son opcionales y admiten null, ya que en edición se permite
 * guardar sin poblar campos que ya se encuentren vacíos. */
export type PublicadorUpdatePayload = {
  [K in keyof PublicadorPayload]?: PublicadorPayload[K] | null;
};
