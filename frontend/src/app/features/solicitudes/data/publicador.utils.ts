import { Publicador } from './models';

export function yearsSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) {
    return null;
  }
  const start = new Date(dateStr);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const today = new Date();
  let years = today.getFullYear() - start.getFullYear();
  const monthDiff = today.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < start.getDate())) {
    years--;
  }
  return Math.max(years, 0);
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) {
    return '—';
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  /** Se leen los componentes en UTC: las fechas de la API vienen como 'YYYY-MM-DD'
   * (sin hora), que Date interpreta como medianoche UTC; usar getters locales
   * corría el día un día atrás en zonas horarias detrás de UTC (ej. Colombia). */
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

export function nombreCompleto(publicador: Pick<Publicador, 'primer_nombre' | 'segundo_nombre' | 'primer_apellido' | 'segundo_apellido'>): string {
  return [
    publicador.primer_nombre,
    publicador.segundo_nombre,
    publicador.primer_apellido,
    publicador.segundo_apellido,
  ]
    .filter((part) => !!part && part.trim().length > 0)
    .join(' ');
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOVIL_PATTERN = /^\d{1,10}$/;

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
