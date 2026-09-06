import { formatDateShort, formatHoraAmPm } from '../../../shared/utils/format.util';
import { toTitleCase } from '../../solicitudes/data/publicador.utils';
import { TurnoValidacionResumen } from './models';

const PLACEHOLDER_PATTERN = /<([^<>]+)>/g;
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/** Mismo conjunto de tokens de nombre que en los mensajes de entrenamiento (ver
 * solicitudes/data/mensaje-placeholder.util.ts): se anteponen con "hermano"/"hermana". */
const NAME_TOKENS = new Set(['primer_nombre', 'nombre_completo']);
const LEADING_NON_CONTENT = /^[\s*_~`]+/;

function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function isStartOfLine(text: string, offset: number): boolean {
  const before = text.slice(0, offset);
  const linePrefix = before.slice(before.lastIndexOf('\n') + 1);
  return linePrefix.replace(LEADING_NON_CONTENT, '').length === 0;
}

function formatNameWithHermano(value: string, sexo: 'M' | 'F' | null, startOfLine: boolean): string {
  if (!value) {
    return '';
  }
  const word = sexo === 'F' ? 'hermana' : 'hermano';
  const prefix = startOfLine ? word[0].toUpperCase() + word.slice(1) : word;
  return `${prefix} ${toTitleCase(value)}`;
}

/** Campos disponibles para los mensajes de categoría "RESPUESTA CASOS": los datos del
 * caso (punto, día/hora, justificaciones) y del publicador solicitante. A diferencia de
 * los mensajes de entrenamiento, aquí no hay datos completos del publicador (solo lo que
 * ya trae TurnoValidacionResumen), así que el conjunto de tokens es más acotado. */
function buildContext(turno: TurnoValidacionResumen): Record<string, string> {
  return {
    primer_nombre: turno.primerNombrePublicador ?? '',
    nombre_completo: turno.nombrePublicador ?? '',
    movil: turno.movil ?? '',
    nombre_punto: turno.nombrePunto ?? '',
    encargado_punto: turno.encargadoPunto ?? '',
    movil_encargado_punto: turno.movilEncargadoPunto ?? '',
    dia: turno.diaNombre ?? '',
    hora_inicio: formatHoraAmPm(turno.horaInicio),
    hora_fin: formatHoraAmPm(turno.horaFin),
    situacion_identificada: turno.situacionIdentificada ?? '',
    justificacion: turno.justificacion ?? '',
    justificacion_aprobacion: turno.justificacionAprobacion ?? '',
    fecha_solicitud: formatDateShort(turno.fechaSolicitud),
    fecha_respuesta: formatDateShort(turno.fechaAprobacion),
  };
}

/** Reemplaza los tokens <campo> de un mensaje de "RESPUESTA CASOS" por los datos del
 * caso. Los tokens no reconocidos (p.ej. campos del menú "/" pensados para mensajes de
 * entrenamiento) se dejan tal cual, igual que en substitutePlaceholders. */
export function substitutePlaceholdersCaso(template: string, turno: TurnoValidacionResumen): string {
  const context = buildContext(turno);
  return template.replace(PLACEHOLDER_PATTERN, (match, token: string, offset: number, full: string) => {
    const key = normalizeToken(token);
    if (!(key in context)) {
      return match;
    }
    if (NAME_TOKENS.has(key)) {
      return formatNameWithHermano(context[key], turno.sexo, isStartOfLine(full, offset));
    }
    return context[key];
  });
}
