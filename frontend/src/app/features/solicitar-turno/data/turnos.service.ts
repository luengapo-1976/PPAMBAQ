import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import {
  ActividadHistorialItem,
  ConteoTurnosPublicador,
  CrearTurnoPayload,
  DevolverTurnoPayload,
  DevolverTurnoResultado,
  DisponibilidadActividad,
  EstadoTurno,
  ReportarActividadPayload,
  ReportarActividadResultado,
  SolicitarTurnoResultado,
  TurnoHistorialItem,
  TurnoResumen,
} from './models';

@Injectable({ providedIn: 'root' })
export class TurnosService {
  private readonly api = inject(ApiService);

  findByCodigoPunto(codigoPunto: number): Observable<TurnoResumen[]> {
    return this.api.get<TurnoResumen[]>('turnos', { codigo_punto: codigoPunto });
  }

  crear(payload: CrearTurnoPayload): Observable<{ mensaje: string }> {
    return this.api.post<{ mensaje: string }>('turnos', payload);
  }

  actualizarEstado(turnoId: string, estadoTurno: EstadoTurno): Observable<{ mensaje: string }> {
    return this.api.patch<{ mensaje: string }>(`turnos/${turnoId}/estado`, {
      estado_turno: estadoTurno,
    });
  }

  /** idPublicador lo usan las páginas administrativas (Editar solicitud, Retirar
   * turno, Informe de turno) para consultar los turnos de un publicador elegido
   * por búsqueda, en vez de los del usuario logueado. */
  contarSolicitados(idPublicador?: string): Observable<ConteoTurnosPublicador> {
    return this.api.get<ConteoTurnosPublicador>(
      'turnos/conteo-publicador',
      idPublicador ? { id_publicador: idPublicador } : undefined,
    );
  }

  solicitar(
    turnoId: string,
    justificacion?: string,
    idPublicador?: string,
  ): Observable<SolicitarTurnoResultado> {
    return this.api.post<SolicitarTurnoResultado>(`turnos/${turnoId}/solicitar`, {
      justificacion,
      id_publicador: idPublicador,
    });
  }

  devolver(
    turnoId: string,
    payload: DevolverTurnoPayload,
    idPublicador?: string,
  ): Observable<DevolverTurnoResultado> {
    return this.api.post<DevolverTurnoResultado>(`turnos/${turnoId}/devolver`, {
      ...payload,
      id_publicador: idPublicador,
    });
  }

  verificarDisponibilidadActividad(
    turnoId: string,
    fecha: string,
    idPublicador?: string,
  ): Observable<DisponibilidadActividad> {
    return this.api.get<DisponibilidadActividad>(`turnos/${turnoId}/actividad-disponibilidad`, {
      fecha,
      ...(idPublicador ? { id_publicador: idPublicador } : {}),
    });
  }

  reportarActividad(
    turnoId: string,
    payload: ReportarActividadPayload,
    idPublicador?: string,
  ): Observable<ReportarActividadResultado> {
    return this.api.post<ReportarActividadResultado>(`turnos/${turnoId}/actividad-reportada`, {
      ...payload,
      id_publicador: idPublicador,
    });
  }

  historialActividad(turnoId: string, idPublicador?: string): Observable<ActividadHistorialItem[]> {
    return this.api.get<ActividadHistorialItem[]>(
      `turnos/${turnoId}/actividad-historial`,
      idPublicador ? { id_publicador: idPublicador } : undefined,
    );
  }

  historialSolicitudes(idPublicador: string): Observable<TurnoHistorialItem[]> {
    return this.api.get<TurnoHistorialItem[]>('turnos/historial-solicitudes', {
      id_publicador: idPublicador,
    });
  }
}
