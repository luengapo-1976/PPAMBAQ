import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { ImagenUploadResult, Noticia, NoticiaPayload } from './models';

@Injectable({ providedIn: 'root' })
export class NoticiasService {
  private readonly api = inject(ApiService);

  listAll(): Observable<Noticia[]> {
    return this.api.get<Noticia[]>('noticias');
  }

  listPublicadas(): Observable<Noticia[]> {
    return this.api.get<Noticia[]>('noticias/publicadas');
  }

  findById(id: string): Observable<Noticia> {
    return this.api.get<Noticia>(`noticias/${id}`);
  }

  create(payload: NoticiaPayload): Observable<Noticia> {
    return this.api.post<Noticia>('noticias', payload);
  }

  update(id: string, payload: Partial<NoticiaPayload>): Observable<Noticia> {
    return this.api.patch<Noticia>(`noticias/${id}`, payload);
  }

  /** Reutiliza el endpoint de adjuntos ya existente (bucket "adjuntos" en
   * Supabase Storage) en vez de montar infraestructura de upload nueva. */
  uploadImagen(file: File): Observable<ImagenUploadResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.api.postFormData<ImagenUploadResult>('mensajes/adjuntos', formData);
  }
}
