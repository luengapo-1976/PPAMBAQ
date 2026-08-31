import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { Publicador, PublicadorUpdatePayload } from '../../solicitudes/data/models';

export interface ActualizarMisDatosResultado {
  mensaje: string;
}

export interface SolicitarBajaResultado {
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class MisDatosService {
  private readonly api = inject(ApiService);

  obtener(): Observable<Publicador> {
    return this.api.get<Publicador>('publicadores/me');
  }

  actualizar(payload: PublicadorUpdatePayload): Observable<ActualizarMisDatosResultado> {
    return this.api.patch<ActualizarMisDatosResultado>('publicadores/me', payload);
  }

  solicitarBaja(justificacion: string): Observable<SolicitarBajaResultado> {
    return this.api.post<SolicitarBajaResultado>('publicadores/me/solicitar-baja', {
      justificacion,
    });
  }
}
