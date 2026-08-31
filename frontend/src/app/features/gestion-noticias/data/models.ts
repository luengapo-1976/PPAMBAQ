export type EstadoNoticia = 'BORRADOR' | 'PUBLICADA';

export type DireccionMover = 'arriba' | 'abajo';

export interface Noticia {
  id: string;
  titulo: string;
  resumen: string;
  contenido: string;
  imagen_url: string | null;
  storage_path: string | null;
  estado: EstadoNoticia;
  orden: number;
  fecha_publicacion: string | null;
  fecha_maxima_publicacion: string | null;
  usuario_registra: string | null;
  fecha_registro: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
}

export interface NoticiaPayload {
  titulo: string;
  resumen: string;
  contenido: string;
  imagen_url: string | null;
  storage_path?: string | null;
  estado?: EstadoNoticia;
  fecha_maxima_publicacion?: string | null;
}

export interface ImagenUploadResult {
  url: string;
  path: string;
}
