import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import {
  ActividadHistorialItem,
  ConteoTurnosPublicador,
  DevolverTurnoPayload,
  DevolverTurnoResultado,
  DisponibilidadActividad,
  ReportarActividadPayload,
  ReportarActividadResultado,
  SolicitarTurnoResultado,
  TurnoResumen,
} from './models';

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

  devolver(turnoId: string, payload: DevolverTurnoPayload): Observable<DevolverTurnoResultado> {
    return this.api.post<DevolverTurnoResultado>(`turnos/${turnoId}/devolver`, payload);
  }

  verificarDisponibilidadActividad(turnoId: string, fecha: string): Observable<DisponibilidadActividad> {
    return this.api.get<DisponibilidadActividad>(`turnos/${turnoId}/actividad-disponibilidad`, { fecha });
  }

  reportarActividad(turnoId: string, payload: ReportarActividadPayload): Observable<ReportarActividadResultado> {
    return this.api.post<ReportarActividadResultado>(`turnos/${turnoId}/actividad-reportada`, payload);
  }

  historialActividad(turnoId: string): Observable<ActividadHistorialItem[]> {
    return this.api.get<ActividadHistorialItem[]>(`turnos/${turnoId}/actividad-historial`);
  }
}
