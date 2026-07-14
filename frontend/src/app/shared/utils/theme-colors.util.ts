/** Lee el valor real de un token de color del sistema de diseño (custom property CSS)
 * para reutilizar la misma paleta en gráficas renderizadas en <canvas>. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
