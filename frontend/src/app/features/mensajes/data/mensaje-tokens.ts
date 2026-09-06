/** Campos de la tabla `publicadores` (y algunos calculados) disponibles para
 * insertar en el texto de un mensaje mediante "/". Al enviar el mensaje, cada
 * <token> se reemplaza por el valor correspondiente del publicador — ver
 * `mensaje-placeholder.util.ts` en el feature de Solicitudes, que implementa
 * esta misma lista. Ordenados alfabéticamente por `token`. */
export interface MensajeToken {
  token: string;
  descripcion: string;
}

export const MENSAJE_TOKENS: MensajeToken[] = [
  { token: 'circuito', descripcion: 'Código del circuito de la congregación del publicador.' },
  { token: 'congregacion', descripcion: 'Nombre de la congregación del publicador.' },
  { token: 'correo_electronico', descripcion: 'Correo electrónico del publicador.' },
  { token: 'direccion', descripcion: 'Dirección de residencia del publicador.' },
  {
    token: 'direccion_primera_capacitacion',
    descripcion: 'Dirección del punto asignado a la primera capacitación.',
  },
  {
    token: 'direccion_segunda_capacitacion',
    descripcion: 'Dirección del punto asignado a la segunda capacitación.',
  },
  {
    token: 'encargado_primera_capacitacion',
    descripcion: 'Encargado del punto asignado a la primera capacitación.',
  },
  {
    token: 'encargado_segunda_capacitacion',
    descripcion: 'Encargado del punto asignado a la segunda capacitación.',
  },
  {
    token: 'entrenamiento_requerido',
    descripcion: 'Etapa de entrenamiento en la que se encuentra el publicador.',
  },
  { token: 'estado', descripcion: 'Estado actual de la solicitud.' },
  { token: 'estado_civil', descripcion: 'Estado civil del publicador.' },
  { token: 'fecha_bautismo', descripcion: 'Fecha de bautismo del publicador.' },
  { token: 'fecha_nacimiento', descripcion: 'Fecha de nacimiento del publicador.' },
  {
    token: 'fecha_primera_capacitacion',
    descripcion: 'Fecha asignada para la primera capacitación.',
  },
  {
    token: 'fecha_segunda_capacitacion',
    descripcion: 'Fecha asignada para la segunda capacitación.',
  },
  { token: 'fecha_solicitud', descripcion: 'Fecha en que se registró la solicitud.' },
  { token: 'login', descripcion: 'Usuario del publicador para ingresar al sistema.' },
  {
    token: 'lugar_primera_capacitacion',
    descripcion: 'Nombre del punto asignado a la primera capacitación.',
  },
  {
    token: 'lugar_segunda_capacitacion',
    descripcion: 'Nombre del punto asignado a la segunda capacitación.',
  },
  { token: 'movil', descripcion: 'Número de móvil del publicador.' },
  {
    token: 'movil_encargado_primera_capacitacion',
    descripcion: 'Móvil del encargado del punto de la primera capacitación.',
  },
  {
    token: 'movil_encargado_segunda_capacitacion',
    descripcion: 'Móvil del encargado del punto de la segunda capacitación.',
  },
  {
    token: 'nombre_completo',
    descripcion:
      'Primer nombre, segundo nombre, primer apellido y segundo apellido, separados por espacio.',
  },
  { token: 'nombre_conyuge', descripcion: 'Nombre del cónyuge del publicador, si aplica.' },
  { token: 'primer_apellido', descripcion: 'Primer apellido del publicador.' },
  { token: 'primer_nombre', descripcion: 'Primer nombre del publicador.' },
  { token: 'privilegio_min', descripcion: 'Privilegio del ministerio del publicador.' },
  { token: 'privilegio_ser', descripcion: 'Privilegio de servicio del publicador.' },
  { token: 'segundo_apellido', descripcion: 'Segundo apellido del publicador.' },
  { token: 'segundo_nombre', descripcion: 'Segundo nombre del publicador.' },
  { token: 'sexo', descripcion: '"Femenino" o "Masculino", según el sexo del publicador.' },
];

/** Campos que, al sustituirse, llevan antepuesta la palabra "hermano"/"hermana"
 * (según el sexo del publicador) y se normalizan a Title Case. */
export const MENSAJE_TOKENS_CON_HERMANO: ReadonlySet<string> = new Set([
  'primer_apellido',
  'segundo_apellido',
  'primer_nombre',
  'segundo_nombre',
  'nombre_completo',
]);

/** Campos disponibles para mensajes de categoría "RESPUESTA CASOS" (los que se envían
 * al aprobar/rechazar un caso en Casos por validar). Es un catálogo distinto al de
 * ENTRENAMIENTO porque el contexto es un caso de turno, no el registro completo de un
 * publicador — debe reflejar exactamente los campos que reconoce la sustitución real,
 * implementada en `casos-por-validar/data/mensaje-respuesta.util.ts`. */
export const MENSAJE_TOKENS_CASO: MensajeToken[] = [
  { token: 'dia', descripcion: 'Día de la semana del turno.' },
  {
    token: 'encargado_punto',
    descripcion: 'Nombre del encargado del punto de predicación del turno.',
  },
  { token: 'fecha_respuesta', descripcion: 'Fecha en que se aprobó o rechazó la solicitud.' },
  { token: 'fecha_solicitud', descripcion: 'Fecha en que se solicitó el turno.' },
  { token: 'hora_fin', descripcion: 'Hora de fin del turno.' },
  { token: 'hora_inicio', descripcion: 'Hora de inicio del turno.' },
  {
    token: 'justificacion',
    descripcion: 'Justificación que dio el publicador al solicitar el turno.',
  },
  {
    token: 'justificacion_aprobacion',
    descripcion: 'Motivo registrado por el administrador al aprobar o rechazar la solicitud.',
  },
  { token: 'movil', descripcion: 'Número de móvil del publicador que solicitó el turno.' },
  {
    token: 'movil_encargado_punto',
    descripcion: 'Número de móvil del encargado del punto de predicación del turno.',
  },
  { token: 'nombre_completo', descripcion: 'Nombre completo del publicador que solicitó el turno.' },
  { token: 'nombre_punto', descripcion: 'Nombre del punto de predicación del turno.' },
  { token: 'primer_nombre', descripcion: 'Primer nombre del publicador que solicitó el turno.' },
  {
    token: 'situacion_identificada',
    descripcion: 'Situación identificada en el turno, si aplica.',
  },
];

/** Igual que MENSAJE_TOKENS_CON_HERMANO, pero para el catálogo de RESPUESTA CASOS: solo
 * existen estos dos campos de nombre en ese contexto. */
export const MENSAJE_TOKENS_CASO_CON_HERMANO: ReadonlySet<string> = new Set([
  'primer_nombre',
  'nombre_completo',
]);
