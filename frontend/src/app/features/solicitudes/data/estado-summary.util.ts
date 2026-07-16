import { Publicador } from './models';

export type CardKey = 'total' | 'pendiente1' | 'pendiente2' | 'cumple';

export type Pendiente1SubOption = 'todos' | 'enviada' | 'pendiente';
export type Pendiente2SubOption = 'todos' | 'enviada' | 'pendiente';
export type CumpleSubOption = 'todos' | 'pendiente1' | 'pendiente2';

export const PENDIENTE_SUB_OPTIONS: { value: Pendiente1SubOption; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'enviada', label: 'Notificación enviada' },
  { value: 'pendiente', label: 'Notificación pendiente' },
];

export const CUMPLE_SUB_OPTIONS: { value: CumpleSubOption; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente1', label: 'Notificación enviada' },
  { value: 'pendiente2', label: 'Notificación pendiente' },
];

/** "Pendiente 1er entrenamiento": entrenamiento_requerido = "Primer entrenamiento",
 * particionado por estado según el sub-filtro seleccionado. */
export function matchesPendiente1(publicador: Publicador, sub: Pendiente1SubOption): boolean {
  const requierePrimero = publicador.entrenamiento_requerido === 'Primer entrenamiento';
  if (sub === 'enviada') {
    return requierePrimero && publicador.estado === 'NOTIFICADO PRIMER ENTRENAMIENTO';
  }
  if (sub === 'pendiente') {
    return requierePrimero && publicador.estado === 'REGISTRADO';
  }
  return requierePrimero;
}

/** "Pendiente 2do entrenamiento": entrenamiento_requerido = "Segundo entrenamiento",
 * particionado por estado según el sub-filtro seleccionado. */
export function matchesPendiente2(publicador: Publicador, sub: Pendiente2SubOption): boolean {
  const requiereSegundo = publicador.entrenamiento_requerido === 'Segundo entrenamiento';
  if (sub === 'enviada') {
    return requiereSegundo && publicador.estado === 'NOTIFICADO SEGUNDO ENTRENAMIENTO';
  }
  if (sub === 'pendiente') {
    return requiereSegundo && publicador.estado !== 'NOTIFICADO SEGUNDO ENTRENAMIENTO';
  }
  return requiereSegundo;
}

/** "Cumple requisitos": estado = CUMPLE REQUISITOS, particionado por entrenamiento_requerido
 * ("Notificación enviada" = Primer entrenamiento, "Notificación pendiente" = Segundo entrenamiento). */
export function matchesCumple(publicador: Publicador, sub: CumpleSubOption): boolean {
  if (sub === 'pendiente1') {
    return publicador.estado === 'CUMPLE REQUISITOS' && publicador.entrenamiento_requerido === 'Primer entrenamiento';
  }
  if (sub === 'pendiente2') {
    return publicador.estado === 'CUMPLE REQUISITOS' && publicador.entrenamiento_requerido === 'Segundo entrenamiento';
  }
  return publicador.estado === 'CUMPLE REQUISITOS';
}
