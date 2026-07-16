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

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOVIL_PATTERN = /^\d{1,10}$/;
