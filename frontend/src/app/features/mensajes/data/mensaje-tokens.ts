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
  { token: 'direccion_primera_capacitacion', descripcion: 'Dirección del punto asignado a la primera capacitación.' },
  { token: 'direccion_segunda_capacitacion', descripcion: 'Dirección del punto asignado a la segunda capacitación.' },
  { token: 'encargado_primera_capacitacion', descripcion: 'Encargado del punto asignado a la primera capacitación.' },
  { token: 'encargado_segunda_capacitacion', descripcion: 'Encargado del punto asignado a la segunda capacitación.' },
  { token: 'entrenamiento_requerido', descripcion: 'Etapa de entrenamiento en la que se encuentra el publicador.' },
  { token: 'estado', descripcion: 'Estado actual de la solicitud.' },
  { token: 'estado_civil', descripcion: 'Estado civil del publicador.' },
  { token: 'fecha_bautismo', descripcion: 'Fecha de bautismo del publicador.' },
  { token: 'fecha_nacimiento', descripcion: 'Fecha de nacimiento del publicador.' },
  { token: 'fecha_primera_capacitacion', descripcion: 'Fecha asignada para la primera capacitación.' },
  { token: 'fecha_segunda_capacitacion', descripcion: 'Fecha asignada para la segunda capacitación.' },
  { token: 'fecha_solicitud', descripcion: 'Fecha en que se registró la solicitud.' },
  { token: 'login', descripcion: 'Usuario del publicador para ingresar al sistema.' },
  { token: 'lugar_primera_capacitacion', descripcion: 'Nombre del punto asignado a la primera capacitación.' },
  { token: 'lugar_segunda_capacitacion', descripcion: 'Nombre del punto asignado a la segunda capacitación.' },
  { token: 'movil', descripcion: 'Número de móvil del publicador.' },
  {
    token: 'movil_encargado_primera_capacitacion',
    descripcion: 'Móvil del encargado del punto de la primera capacitación.',
  },
  {
    token: 'movil_encargado_segunda_capacitacion',
    descripcion: 'Móvil del encargado del punto de la segunda capacitación.',
  },
  { token: 'nombre_completo', descripcion: 'Primer nombre, segundo nombre, primer apellido y segundo apellido, separados por espacio.' },
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
