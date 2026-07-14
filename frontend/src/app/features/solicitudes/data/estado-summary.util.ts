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
  { value: 'pendiente1', label: 'Pendiente 1er entrenamiento' },
  { value: 'pendiente2', label: 'Pendiente 2do entrenamiento' },
];

/** "Pendiente 1er entrenamiento": REGISTRADO / NOTIFICADO PRIMER ENTRENAMIENTO,
 * más quienes tengan entrenamiento_requerido = "Primer entrenamiento". */
export function matchesPendiente1(publicador: Publicador, sub: Pendiente1SubOption): boolean {
  const requierePrimero = publicador.entrenamiento_requerido === 'Primer entrenamiento';
  if (sub === 'enviada') {
    return publicador.estado === 'NOTIFICADO PRIMER ENTRENAMIENTO';
  }
  if (sub === 'pendiente') {
    return publicador.estado === 'REGISTRADO';
  }
  return (
    publicador.estado === 'REGISTRADO' ||
    publicador.estado === 'NOTIFICADO PRIMER ENTRENAMIENTO' ||
    requierePrimero
  );
}

/** "Pendiente 2do entrenamiento". */
export function matchesPendiente2(publicador: Publicador, sub: Pendiente2SubOption): boolean {
  const requiereSegundo = publicador.entrenamiento_requerido === 'Segundo entrenamiento';
  if (sub === 'todos') {
    // "Todos" cuenta únicamente por entrenamiento_requerido, sin importar el estado.
    return requiereSegundo;
  }
  if (sub === 'pendiente') {
    return publicador.estado === 'NOTIFICADO PRIMER ENTRENAMIENTO' || requiereSegundo;
  }
  // enviada
  return publicador.estado === 'NOTIFICADO SEGUNDO ENTRENAMIENTO' || requiereSegundo;
}

/** "Cumple requisitos": CUMPLE REQUISITOS, particionado por entrenamiento_requerido. */
export function matchesCumple(publicador: Publicador, sub: CumpleSubOption): boolean {
  if (sub === 'pendiente1') {
    return publicador.estado === 'CUMPLE REQUISITOS' && publicador.entrenamiento_requerido === 'Primer entrenamiento';
  }
  if (sub === 'pendiente2') {
    return publicador.estado === 'CUMPLE REQUISITOS' && publicador.entrenamiento_requerido === 'Segundo entrenamiento';
  }
  return publicador.estado === 'CUMPLE REQUISITOS';
}
