import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { RetiroResumen, TurnoValidacionResumen } from './models';

@Injectable({ providedIn: 'root' })
export class CasosPorValidarService {
  private readonly api = inject(ApiService);

  turnosPendientes(): Observable<TurnoValidacionResumen[]> {
    return this.api.get<TurnoValidacionResumen[]>('turnos/validacion/pendientes');
  }

  turnosAprobados(): Observable<TurnoValidacionResumen[]> {
    return this.api.get<TurnoValidacionResumen[]>('turnos/validacion/aprobados');
  }

  turnosRechazados(): Observable<TurnoValidacionResumen[]> {
    return this.api.get<TurnoValidacionResumen[]>('turnos/validacion/rechazados');
  }

  aprobarTurno(id: string, justificacion: string): Observable<{ mensaje: string }> {
    return this.api.post<{ mensaje: string }>(`turnos/${id}/aprobar-solicitud`, { justificacion });
  }

  rechazarTurno(id: string, justificacion: string): Observable<{ mensaje: string }> {
    return this.api.post<{ mensaje: string }>(`turnos/${id}/rechazar-solicitud`, { justificacion });
  }

  retirosPendientes(): Observable<RetiroResumen[]> {
    return this.api.get<RetiroResumen[]>('publicadores/retiros/pendientes');
  }

  retirosAprobados(): Observable<RetiroResumen[]> {
    return this.api.get<RetiroResumen[]>('publicadores/retiros/aprobados');
  }

  aprobarRetiro(id: string, observaciones: string): Observable<{ mensaje: string }> {
    return this.api.post<{ mensaje: string }>(`publicadores/retiros/${id}/aprobar`, {
      observaciones,
    });
  }
}
