import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import {
  MensajeRelacionadoCon,
  Publicador,
  PublicadorPayload,
  PublicadorRetiradoBusqueda,
  PublicadorUpdatePayload,
} from './models';

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

  /** Retiro de la PPAM registrado por un administrador en nombre de un publicador
   * elegido por búsqueda — misma lógica que "Solicitar mi baja" del participante, pero
   * con el id explícito en la ruta. */
  solicitarBaja(id: string, justificacion: string): Observable<{ mensaje: string }> {
    return this.api.post<{ mensaje: string }>(`publicadores/${id}/solicitar-baja`, {
      justificacion,
    });
  }

  /** "Nueva solicitud": busca si la persona ya existió antes en la PPAM y se retiró
   * (tabla publicadores_retirados), por móvil y/o correo. Solo tiene sentido llamarla
   * cuando ya se confirmó que no hay coincidencia entre los publicadores activos. */
  buscarRetirados(
    movil: string | null,
    correo: string | null,
  ): Observable<PublicadorRetiradoBusqueda[]> {
    const params: Record<string, string> = {};
    if (movil) {
      params['movil'] = movil;
    }
    if (correo) {
      params['correo'] = correo;
    }
    return this.api.get<PublicadorRetiradoBusqueda[]>('publicadores/retirados/buscar', params);
  }
}
