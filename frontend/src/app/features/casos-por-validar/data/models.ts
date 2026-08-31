export interface TurnoValidacionResumen {
  id: string;
  nombrePunto: string;
  diaNombre: string;
  horaInicio: string;
  horaFin: string;
  situacionIdentificada: string | null;
  nombrePublicador: string;
  primerNombrePublicador: string;
  movil: string | null;
  fechaNacimiento: string | null;
  justificacion: string | null;
  nombreConyuge: string | null;
  fechaSolicitud: string | null;
  aprobadoPor: string | null;
  justificacionAprobacion: string | null;
  fechaAprobacion: string | null;
  parejaNombre: string | null;
  parejaMovil: string | null;
}

export interface RetiroResumen {
  id: string;
  primer_nombre: string | null;
  segundo_nombre: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  movil: string | null;
  codigo_congregacion: number | null;
  fecha_nacimiento: string | null;
  fecha_bautismo: string | null;
  privilegio_ser: string | null;
  justificacion: string;
  fecha_retiro: string | null;
  estado_solicitud_retiro: string | null;
  valida_retiro: string | null;
  observaciones_retiro: string | null;
  fecha_validacion_retiro: string | null;
}
