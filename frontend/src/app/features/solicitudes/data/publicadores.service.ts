import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { Publicador, PublicadorPayload } from './models';

@Injectable({ providedIn: 'root' })
export class PublicadoresService {
  private readonly api = inject(ApiService);

  list(): Observable<Publicador[]> {
    return this.api.get<Publicador[]>('publicadores');
  }

  create(payload: PublicadorPayload): Observable<Publicador> {
    return this.api.post<Publicador>('publicadores', payload);
  }

  update(id: string, payload: PublicadorPayload): Observable<Publicador> {
    return this.api.patch<Publicador>(`publicadores/${id}`, payload);
  }

  notificarEntrenamiento(ids: string[]): Observable<{ actualizados: number }> {
    return this.api.patch<{ actualizados: number }>('publicadores/notificar-entrenamiento', { ids });
  }
}
