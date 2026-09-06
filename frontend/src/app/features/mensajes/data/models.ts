export const MENSAJE_CATEGORIA_VALUES = ['ENTRENAMIENTO', 'RESPUESTA CASOS'] as const;
export type MensajeCategoria = (typeof MENSAJE_CATEGORIA_VALUES)[number];

export const MENSAJE_CATEGORIA_OPTIONS: { value: MensajeCategoria; label: string }[] = [
  { value: 'ENTRENAMIENTO', label: 'Entrenamiento' },
  { value: 'RESPUESTA CASOS', label: 'Respuesta casos' },
];

export interface Mensaje {
  id: string;
  categoria: MensajeCategoria;
  tipo: string;
  mensaje: string;
  adjunto_asociado: string | null;
  usuario_registra: string | null;
  fecha_registro: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
}

export interface MensajePayload {
  categoria: MensajeCategoria;
  tipo: string;
  mensaje: string;
  adjunto_asociado: string | null;
}

export interface AdjuntoUploadResult {
  url: string;
  path: string;
}
