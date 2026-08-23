export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Fecha actual en la zona horaria de Colombia (America/Bogota, UTC-5 fijo, sin horario
 * de verano). A diferencia de todayIsoDate(), no asume que el servidor corre en UTC. */
export function todayIsoDateBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}
