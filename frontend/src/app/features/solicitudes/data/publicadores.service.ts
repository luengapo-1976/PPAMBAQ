import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { MensajeRelacionadoCon, Publicador, PublicadorPayload, PublicadorUpdatePayload } from './models';

@Injectable({ providedIn: 'root' })
export class PublicadoresService {
  private readonly api = inject(ApiService);

  list(): Observable<Publicador[]> {
    return this.api.get<Publicador[]>('publicadores');
  }

  create(payload: PublicadorPayload): Observable<Publicador> {
    return this.api.post<Publicador>('publicadores', payload);
  }

  update(id: string, payload: PublicadorUpdatePayload): Observable<Publicador> {
    return this.api.patch<Publicador>(`publicadores/${id}`, payload);
  }

  notificarEntrenamiento(
    ids: string[],
    mensajeRelacionadoCon: MensajeRelacionadoCon,
  ): Observable<{ actualizados: number }> {
    return this.api.patch<{ actualizados: number }>('publicadores/notificar-entrenamiento', {
      ids,
      mensajeRelacionadoCon,
    });
  }

  asignarLugarEntrenamiento(
    ids: string[],
    tipoEntrenamiento: 'Primer entrenamiento' | 'Segundo entrenamiento',
    fecha: string,
    codigoPunto: number,
  ): Observable<{ actualizados: number }> {
    return this.api.patch<{ actualizados: number }>('publicadores/asignar-lugar-entrenamiento', {
      ids,
      tipoEntrenamiento,
      fecha,
      codigoPunto,
    });
  }

  marcarExisteBdAnterior(ids: string[]): Observable<{ actualizados: number }> {
    return this.api.patch<{ actualizados: number }>('publicadores/marcar-existe-bd-anterior', { ids });
  }

  quitarLugarEntrenamiento(ids: string[]): Observable<{ actualizados: number }> {
    return this.api.patch<{ actualizados: number }>('publicadores/quitar-lugar-entrenamiento', { ids });
  }

  confirmarAsistencia(
    ids: string[],
    tipoEntrenamiento: 'Primer entrenamiento' | 'Segundo entrenamiento',
  ): Observable<{ actualizados: number }> {
    return this.api.patch<{ actualizados: number }>('publicadores/confirmar-asistencia', {
      ids,
      tipoEntrenamiento,
    });
  }

  revertirAsistencia(
    ids: string[],
    tipoEntrenamiento: 'Primer entrenamiento' | 'Segundo entrenamiento',
  ): Observable<{ actualizados: number }> {
    return this.api.patch<{ actualizados: number }>('publicadores/revertir-asistencia', {
      ids,
      tipoEntrenamiento,
    });
  }
}
