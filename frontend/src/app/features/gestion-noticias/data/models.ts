export type EstadoNoticia = 'BORRADOR' | 'PUBLICADA';

export interface Noticia {
  id: string;
  titulo: string;
  resumen: string;
  contenido: string;
  imagen_url: string | null;
  estado: EstadoNoticia;
  fecha_publicacion: string | null;
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
  estado?: EstadoNoticia;
}

export interface ImagenUploadResult {
  url: string;
  path: string;
}
