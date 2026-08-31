import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { Banner, BannerPayload, DireccionMover, ImagenBannerUploadResult } from './models';

@Injectable({ providedIn: 'root' })
export class BannersService {
  private readonly api = inject(ApiService);

  listAll(): Observable<Banner[]> {
    return this.api.get<Banner[]>('banners');
  }

  listVisibles(): Observable<Banner[]> {
    return this.api.get<Banner[]>('banners/visibles');
  }

  create(payload: BannerPayload): Observable<Banner> {
    return this.api.post<Banner>('banners', payload);
  }

  setActivo(id: string, activo: boolean): Observable<Banner> {
    return this.api.patch<Banner>(`banners/${id}`, { activo });
  }

  mover(id: string, direccion: DireccionMover): Observable<void> {
    return this.api.patch<void>(`banners/${id}/mover`, { direccion });
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`banners/${id}`);
  }

  /** Endpoint propio (no reutiliza mensajes/adjuntos) porque valida dimensión
   * exacta de la imagen antes de subirla a Storage. */
  uploadImagen(file: File): Observable<ImagenBannerUploadResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.api.postFormData<ImagenBannerUploadResult>('banners/imagenes', formData);
  }
}
