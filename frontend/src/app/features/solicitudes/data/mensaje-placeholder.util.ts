import { Punto } from '../../configuracion/data/models';
import { Publicador, Sexo } from './models';
import { formatDateShort, nombreCompleto, toTitleCase, yearsSince } from './publicador.utils';

const PLACEHOLDER_PATTERN = /<([^<>]+)>/g;
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/** Código de país por defecto para armar el número internacional (Colombia). */
const DEFAULT_COUNTRY_CODE = '57';

/** Tokens de nombre/apellido: al sustituirlos se les antepone "hermano"/"hermana"
 * según el sexo del publicador y el valor se normaliza a Title Case (ver
 * formatNameWithHermano). El resto de los tokens se sustituyen tal cual. */
const NAME_TOKENS = new Set(['primer_apellido', 'segundo_apellido', 'primer_nombre', 'segundo_nombre', 'nombre_completo']);

function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function puntoDe(puntos: Punto[], codigo: number | null): Punto | null {
  if (codigo == null) {
    return null;
  }
  return puntos.find((p) => p.codigo_punto === codigo) ?? null;
}

function puntoCampo(puntos: Punto[], codigo: number | null, campo: 'nombre_punto' | 'direccion' | 'encargado' | 'movil'): string {
  return puntoDe(puntos, codigo)?.[campo] ?? '';
}

export function buildPlaceholderContext(publicador: Publicador, puntos: Punto[] = []): Record<string, string> {
  return {
    // Alias históricos (compatibilidad con mensajes redactados antes del menú "/").
    hermano: publicador.sexo === 'F' ? 'Hermana' : 'Hermano',
    'nombre de la persona': publicador.primer_nombre ?? '',
    nombre_congregacion: publicador.nombre_congregacion ?? '',
    codigo_circuito: publicador.codigo_circuito ?? '',
    edad: String(yearsSince(publicador.fecha_nacimiento) ?? ''),
    anios_bautismo: String(yearsSince(publicador.fecha_bautismo) ?? ''),
    participo_antes: publicador.participo_antes ?? '',

    // Columnas de publicadores y campos calculados del menú de autocompletado ("/").
    login: publicador.login ?? '',
    direccion: publicador.direccion ?? '',
    correo_electronico: publicador.correo_electronico ?? '',
    movil: publicador.movil ?? '',
    sexo: publicador.sexo === 'F' ? 'Femenino' : publicador.sexo === 'M' ? 'Masculino' : '',
    fecha_nacimiento: formatDateShort(publicador.fecha_nacimiento),
    fecha_bautismo: formatDateShort(publicador.fecha_bautismo),
    estado_civil: publicador.estado_civil ?? '',
    nombre_conyuge: publicador.nombre_conyuge ?? '',
    privilegio_min: publicador.privilegio_min ?? '',
    privilegio_ser: publicador.privilegio_ser ?? '',
    fecha_solicitud: formatDateShort(publicador.fecha_solicitud),
    estado: publicador.estado ?? '',
    entrenamiento_requerido: publicador.entrenamiento_requerido ?? '',
    congregacion: publicador.nombre_congregacion ?? '',
    circuito: publicador.codigo_circuito ?? '',

    fecha_primera_capacitacion: formatDateShort(publicador.fecha_primera_capacitacion),
    lugar_primera_capacitacion: puntoCampo(puntos, publicador.lugar_primera_capacitacion, 'nombre_punto'),
    direccion_primera_capacitacion: puntoCampo(puntos, publicador.lugar_primera_capacitacion, 'direccion'),
    encargado_primera_capacitacion: puntoCampo(puntos, publicador.lugar_primera_capacitacion, 'encargado'),
    movil_encargado_primera_capacitacion: puntoCampo(puntos, publicador.lugar_primera_capacitacion, 'movil'),

    fecha_segunda_capacitacion: formatDateShort(publicador.fecha_segunda_capacitacion),
    lugar_segunda_capacitacion: puntoCampo(puntos, publicador.lugar_segunda_capacitacion, 'nombre_punto'),
    direccion_segunda_capacitacion: puntoCampo(puntos, publicador.lugar_segunda_capacitacion, 'direccion'),
    encargado_segunda_capacitacion: puntoCampo(puntos, publicador.lugar_segunda_capacitacion, 'encargado'),
    movil_encargado_segunda_capacitacion: puntoCampo(puntos, publicador.lugar_segunda_capacitacion, 'movil'),

    // Nombres/apellidos: valores "crudos" — substitutePlaceholders les antepone
    // "hermano"/"hermana" y los normaliza a Title Case antes de insertarlos.
    primer_apellido: publicador.primer_apellido ?? '',
    segundo_apellido: publicador.segundo_apellido ?? '',
    primer_nombre: publicador.primer_nombre ?? '',
    segundo_nombre: publicador.segundo_nombre ?? '',
    nombre_completo: nombreCompleto(publicador),
  };
}

/** Marcadores de énfasis de WhatsApp (negrita/cursiva/tachado) que los botones
 * del editor anteponen al texto seleccionado. No cuentan como "contenido" al
 * determinar el inicio de línea: "*<primer_nombre>*" debe seguir capitalizando. */
const LEADING_NON_CONTENT = /^[\s*_~`]+/;

/** true si, mirando hacia atrás desde `offset` hasta el último salto de línea
 * (o el inicio del texto), solo hay espacios en blanco y/o marcadores de estilo
 * — es decir, el match es el primer contenido real de su línea. */
function isStartOfLine(text: string, offset: number): boolean {
  const before = text.slice(0, offset);
  const linePrefix = before.slice(before.lastIndexOf('\n') + 1);
  return linePrefix.replace(LEADING_NON_CONTENT, '').length === 0;
}

function formatNameWithHermano(value: string, sexo: Sexo, startOfLine: boolean): string {
  if (!value) {
    return '';
  }
  const word = sexo === 'F' ? 'hermana' : 'hermano';
  const prefix = startOfLine ? word[0].toUpperCase() + word.slice(1) : word;
  return `${prefix} ${toTitleCase(value)}`;
}

/** Reemplaza los tokens <campo> por el valor correspondiente del publicador.
 * La comparación ignora mayúsculas, tildes y espacios extra, así que
 * <Móvil>, <movil> y <MÓVIL> resuelven igual. Si el token no coincide con
 * ningún campo conocido, se deja tal cual (no se inventa nada).
 *
 * Los tokens de nombre/apellido (<primer_nombre>, <primer_apellido>,
 * <segundo_nombre>, <segundo_apellido>, <nombre_completo>) llevan además el
 * prefijo "hermano"/"hermana" según el sexo del publicador — con mayúscula
 * inicial si el token está al comienzo de una línea, en minúscula en caso
 * contrario — y el nombre se normaliza a Title Case. */
export function substitutePlaceholders(template: string, publicador: Publicador, puntos: Punto[] = []): string {
  const context = buildPlaceholderContext(publicador, puntos);
  return template.replace(PLACEHOLDER_PATTERN, (match, token: string, offset: number, full: string) => {
    const key = normalizeToken(token);
    if (!(key in context)) {
      return match;
    }
    if (NAME_TOKENS.has(key)) {
      return formatNameWithHermano(context[key], publicador.sexo, isStartOfLine(full, offset));
    }
    return context[key];
  });
}

export function buildWhatsAppLink(movil: string, message: string): string {
  const digits = movil.replace(/\D/g, '');
  const withCountryCode = digits.length === 10 ? `${DEFAULT_COUNTRY_CODE}${digits}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
