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

/** Convierte una hora 'HH:MM:SS' (columna time de Postgres) a formato 12h, ej. '02:30 pm'. */
export function formatHoraAmPm(time: string | null | undefined): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time ?? '');
  if (!match) {
    return '—';
  }
  const hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? 'pm' : 'am';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
}

/** Fecha actual en la zona horaria de Colombia (America/Bogota), como 'YYYY-MM-DD'.
 * Mismo criterio que el equivalente en el backend (todayIsoDateBogota): no asume
 * que el navegador corre en esa zona horaria. */
export function todayIsoDateBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOVIL_PATTERN = /^\d{1,10}$/;
