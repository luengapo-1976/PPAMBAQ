import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import {
  Capacitacion,
  CapacitacionPayload,
  DireccionMover,
  ImagenCapacitacionUploadResult,
} from './models';

@Injectable({ providedIn: 'root' })
export class CapacitacionesService {
  private readonly api = inject(ApiService);

  listAll(): Observable<Capacitacion[]> {
    return this.api.get<Capacitacion[]>('capacitaciones');
  }

  listVisibles(): Observable<Capacitacion[]> {
    return this.api.get<Capacitacion[]>('capacitaciones/visibles');
  }

  findById(id: string): Observable<Capacitacion> {
    return this.api.get<Capacitacion>(`capacitaciones/${id}`);
  }

  create(payload: CapacitacionPayload): Observable<Capacitacion> {
    return this.api.post<Capacitacion>('capacitaciones', payload);
  }

  update(id: string, payload: Partial<CapacitacionPayload>): Observable<Capacitacion> {
    return this.api.patch<Capacitacion>(`capacitaciones/${id}`, payload);
  }

  setActivo(id: string, activo: boolean): Observable<Capacitacion> {
    return this.api.patch<Capacitacion>(`capacitaciones/${id}`, { activo });
  }

  mover(id: string, direccion: DireccionMover): Observable<void> {
    return this.api.patch<void>(`capacitaciones/${id}/mover`, { direccion });
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`capacitaciones/${id}`);
  }

  uploadImagen(file: File): Observable<ImagenCapacitacionUploadResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.api.postFormData<ImagenCapacitacionUploadResult>(
      'capacitaciones/imagenes',
      formData,
    );
  }
}
