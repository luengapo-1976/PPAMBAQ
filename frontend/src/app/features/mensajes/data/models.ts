export interface Mensaje {
  id: string;
  tipo: string;
  mensaje: string;
  adjunto_asociado: string | null;
  usuario_registra: string | null;
  fecha_registro: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
}

export interface MensajePayload {
  tipo: string;
  mensaje: string;
  adjunto_asociado: string | null;
}

export interface AdjuntoUploadResult {
  url: string;
  path: string;
}
