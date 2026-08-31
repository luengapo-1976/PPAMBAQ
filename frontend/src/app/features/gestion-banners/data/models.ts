export interface Banner {
  id: string;
  imagen_url: string;
  storage_path: string;
  orden: number;
  activo: boolean;
  ancho_px: number;
  alto_px: number;
  usuario_registra: string | null;
  fecha_registro: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
}

export interface BannerPayload {
  imagen_url: string;
  storage_path: string;
  ancho_px: number;
  alto_px: number;
  activo?: boolean;
}

export type DireccionMover = 'arriba' | 'abajo';

export interface ImagenBannerUploadResult {
  url: string;
  path: string;
  width: number;
  height: number;
}
