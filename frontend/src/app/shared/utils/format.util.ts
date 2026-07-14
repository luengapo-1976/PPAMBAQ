export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) {
    return '—';
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOVIL_PATTERN = /^\d{1,10}$/;
