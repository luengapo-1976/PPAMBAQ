import { Publicador } from './models';
import { formatDateShort, nombreCompleto, yearsSince } from './publicador.utils';

const PLACEHOLDER_PATTERN = /<([^<>]+)>/g;
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/** Código de país por defecto para armar el número internacional (Colombia). */
const DEFAULT_COUNTRY_CODE = '57';

function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function buildPlaceholderContext(publicador: Publicador): Record<string, string> {
  return {
    // Alias específicos pedidos para los mensajes de WhatsApp.
    hermano: publicador.sexo === 'F' ? 'Hermana' : 'Hermano',
    'nombre de la persona': publicador.primer_nombre ?? '',
    login: publicador.login ?? '',

    // Nombres de columna de la tabla publicadores (y algunos calculados de conveniencia).
    primer_apellido: publicador.primer_apellido ?? '',
    segundo_apellido: publicador.segundo_apellido ?? '',
    primer_nombre: publicador.primer_nombre ?? '',
    segundo_nombre: publicador.segundo_nombre ?? '',
    nombre_completo: nombreCompleto(publicador),
    direccion: publicador.direccion ?? '',
    correo_electronico: publicador.correo_electronico ?? '',
    movil: publicador.movil ?? '',
    nombre_congregacion: publicador.nombre_congregacion ?? '',
    codigo_circuito: publicador.codigo_circuito ?? '',
    fecha_nacimiento: formatDateShort(publicador.fecha_nacimiento),
    edad: String(yearsSince(publicador.fecha_nacimiento) ?? ''),
    fecha_bautismo: formatDateShort(publicador.fecha_bautismo),
    anios_bautismo: String(yearsSince(publicador.fecha_bautismo) ?? ''),
    estado_civil: publicador.estado_civil ?? '',
    nombre_conyuge: publicador.nombre_conyuge ?? '',
    privilegio_min: publicador.privilegio_min ?? '',
    privilegio_ser: publicador.privilegio_ser ?? '',
    participo_antes: publicador.participo_antes ?? '',
    fecha_solicitud: formatDateShort(publicador.fecha_solicitud),
    estado: publicador.estado ?? '',
    entrenamiento_requerido: publicador.entrenamiento_requerido ?? '',
  };
}

/** Reemplaza los tokens <campo> por el valor correspondiente del publicador.
 * La comparación ignora mayúsculas, tildes y espacios extra, así que
 * <Móvil>, <movil> y <MÓVIL> resuelven igual. Si el token no coincide con
 * ningún campo conocido, se deja tal cual (no se inventa nada). */
export function substitutePlaceholders(template: string, publicador: Publicador): string {
  const context = buildPlaceholderContext(publicador);
  return template.replace(PLACEHOLDER_PATTERN, (match, token: string) => {
    const key = normalizeToken(token);
    return key in context ? context[key] : match;
  });
}

export function buildWhatsAppLink(movil: string, message: string): string {
  const digits = movil.replace(/\D/g, '');
  const withCountryCode = digits.length === 10 ? `${DEFAULT_COUNTRY_CODE}${digits}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
