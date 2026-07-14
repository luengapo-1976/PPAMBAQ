import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { AdjuntoUploadResult, Mensaje, MensajePayload } from './models';

@Injectable({ providedIn: 'root' })
export class MensajesService {
  private readonly api = inject(ApiService);

  list(): Observable<Mensaje[]> {
    return this.api.get<Mensaje[]>('mensajes');
  }

  create(payload: MensajePayload): Observable<Mensaje> {
    return this.api.post<Mensaje>('mensajes', payload);
  }

  update(id: string, payload: MensajePayload): Observable<Mensaje> {
    return this.api.patch<Mensaje>(`mensajes/${id}`, payload);
  }

  uploadAdjunto(file: File): Observable<AdjuntoUploadResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.api.postFormData<AdjuntoUploadResult>('mensajes/adjuntos', formData);
  }
}
