export type TipoCapacitacion = 'IMAGEN' | 'VIDEO';
export type DireccionMover = 'arriba' | 'abajo';

export interface Capacitacion {
  id: string;
  tipo: TipoCapacitacion;
  titulo: string;
  resumen: string;
  imagen_url: string | null;
  storage_path: string | null;
  video_url: string | null;
  orden: number;
  activo: boolean;
  fecha_maxima_publicacion: string | null;
  usuario_registra: string | null;
  fecha_registro: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
}

export interface CapacitacionPayload {
  tipo: TipoCapacitacion;
  titulo: string;
  resumen: string;
  imagen_url?: string | null;
  storage_path?: string | null;
  video_url?: string | null;
  fecha_maxima_publicacion?: string | null;
}

export interface ImagenCapacitacionUploadResult {
  url: string;
  path: string;
}
