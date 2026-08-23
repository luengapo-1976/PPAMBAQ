import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { ConteoTurnosPublicador, SolicitarTurnoResultado, TurnoResumen } from './models';

@Injectable({ providedIn: 'root' })
export class TurnosService {
  private readonly api = inject(ApiService);

  findByCodigoPunto(codigoPunto: number): Observable<TurnoResumen[]> {
    return this.api.get<TurnoResumen[]>('turnos', { codigo_punto: codigoPunto });
  }

  contarSolicitados(): Observable<ConteoTurnosPublicador> {
    return this.api.get<ConteoTurnosPublicador>('turnos/conteo-publicador');
  }

  solicitar(turnoId: string, justificacion?: string): Observable<SolicitarTurnoResultado> {
    return this.api.post<SolicitarTurnoResultado>(`turnos/${turnoId}/solicitar`, { justificacion });
  }
}
