// TODO: reemplazar por el login del usuario autenticado cuando exista el módulo de auth (JWT).
export const CURRENT_USER_LOGIN = 'admin';

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
