import { EstadoCivil, EstadoSolicitud, Publicador } from '../../solicitudes/data/models';
import { ESTADO_CONFIG } from '../../solicitudes/data/estado.config';
import { nombreCompleto } from '../../solicitudes/data/publicador.utils';

export interface DashboardFilters {
  codigoDepartamento: string | null;
  codigoMunicipio: string | null;
  codigoCircuito: string | null;
  codigoCongregacion: number | null;
  fechaSolicitudDesde: string | null;
  fechaSolicitudHasta: string | null;
}

export const EMPTY_DASHBOARD_FILTERS: DashboardFilters = {
  codigoDepartamento: null,
  codigoMunicipio: null,
  codigoCircuito: null,
  codigoCongregacion: null,
  fechaSolicitudDesde: null,
  fechaSolicitudHasta: null,
};

export function applyDashboardFilters(rows: Publicador[], filters: DashboardFilters): Publicador[] {
  return rows.filter((row) => {
    if (filters.codigoDepartamento && row.codigo_departamento !== filters.codigoDepartamento) {
      return false;
    }
    if (filters.codigoMunicipio && row.codigo_municipio !== filters.codigoMunicipio) {
      return false;
    }
    if (filters.codigoCircuito && row.codigo_circuito !== filters.codigoCircuito) {
      return false;
    }
    if (
      filters.codigoCongregacion != null &&
      row.codigo_congregacion !== filters.codigoCongregacion
    ) {
      return false;
    }
    if (
      filters.fechaSolicitudDesde &&
      (!row.fecha_solicitud || row.fecha_solicitud < filters.fechaSolicitudDesde)
    ) {
      return false;
    }
    if (
      filters.fechaSolicitudHasta &&
      (!row.fecha_solicitud || row.fecha_solicitud > filters.fechaSolicitudHasta)
    ) {
      return false;
    }
    return true;
  });
}

export interface DashboardKpis {
  total: number;
  pendientes: number;
  aprobados: number;
  pendientesEntrenamiento: number;
  nuevasEsteMes: number;
  congregacionesActivas: number;
}

export function computeKpis(rows: Publicador[]): DashboardKpis {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const congregaciones = new Set<number>();
  let aprobados = 0;
  let pendientesEntrenamiento = 0;
  let nuevasEsteMes = 0;

  for (const row of rows) {
    if (row.estado === 'CUMPLE REQUISITOS') {
      aprobados++;
    }
    if (row.entrenamiento_requerido !== 'Entrenamiento completado') {
      pendientesEntrenamiento++;
    }
    if (row.fecha_solicitud?.startsWith(currentMonthPrefix)) {
      nuevasEsteMes++;
    }
    if (row.codigo_congregacion != null) {
      congregaciones.add(row.codigo_congregacion);
    }
  }

  return {
    total: rows.length,
    pendientes: rows.length - aprobados,
    aprobados,
    pendientesEntrenamiento,
    nuevasEsteMes,
    congregacionesActivas: congregaciones.size,
  };
}

export interface DistributionSlice {
  label: string;
  value: number;
}

const ESTADO_ORDER: EstadoSolicitud[] = [
  'REGISTRADO',
  'NOTIFICADO PRIMER ENTRENAMIENTO',
  'NOTIFICADO SEGUNDO ENTRENAMIENTO',
  'CUMPLE REQUISITOS',
];

export function distributionByEstado(rows: Publicador[]): DistributionSlice[] {
  const counts = new Map<EstadoSolicitud, number>();
  for (const row of rows) {
    counts.set(row.estado, (counts.get(row.estado) ?? 0) + 1);
  }
  return ESTADO_ORDER.map((estado) => ({
    label: ESTADO_CONFIG[estado].label,
    value: counts.get(estado) ?? 0,
  }));
}

export function distributionBySexo(rows: Publicador[]): DistributionSlice[] {
  let masculino = 0;
  let femenino = 0;
  for (const row of rows) {
    if (row.sexo === 'M') {
      masculino++;
    } else if (row.sexo === 'F') {
      femenino++;
    }
  }
  return [
    { label: 'Masculino', value: masculino },
    { label: 'Femenino', value: femenino },
  ];
}

const ESTADO_CIVIL_ORDER: EstadoCivil[] = ['Soltero', 'Casado', 'Divorciado', 'Separado', 'Viudo'];

export function distributionByEstadoCivil(rows: Publicador[]): DistributionSlice[] {
  const counts = new Map<EstadoCivil, number>();
  for (const row of rows) {
    counts.set(row.estado_civil, (counts.get(row.estado_civil) ?? 0) + 1);
  }
  return ESTADO_CIVIL_ORDER.map((estadoCivil) => ({
    label: estadoCivil,
    value: counts.get(estadoCivil) ?? 0,
  })).filter((slice) => slice.value > 0);
}

export function topCongregaciones(rows: Publicador[], limit = 8): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = row.nombre_congregacion ?? 'Sin congregación';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export interface MonthlyTrendPoint {
  monthLabel: string;
  solicitudes: number;
  aprobaciones: number;
}

export function monthlyTrend(rows: Publicador[], months = 12): MonthlyTrendPoint[] {
  const now = new Date();
  const buckets: MonthlyTrendPoint[] = [];
  const keyToIndex = new Map<string, number>();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    keyToIndex.set(key, buckets.length);
    buckets.push({
      monthLabel: date.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }),
      solicitudes: 0,
      aprobaciones: 0,
    });
  }

  for (const row of rows) {
    if (row.fecha_solicitud) {
      const idx = keyToIndex.get(row.fecha_solicitud.slice(0, 7));
      if (idx !== undefined) {
        buckets[idx].solicitudes++;
      }
    }
    if (row.fecha_aprobacion) {
      const idx = keyToIndex.get(row.fecha_aprobacion.slice(0, 7));
      if (idx !== undefined) {
        buckets[idx].aprobaciones++;
      }
    }
  }

  return buckets;
}

export interface RecentActivityItem {
  id: string;
  nombre: string;
  estado: EstadoSolicitud;
  congregacion: string;
  fecha: string;
  accion: 'Registrado' | 'Modificado';
}

export function recentActivity(rows: Publicador[], limit = 8): RecentActivityItem[] {
  return [...rows]
    .filter(
      (row) => !!(row.fecha_modificacion || row.fecha_registro) && row.estado in ESTADO_CONFIG,
    )
    .map((row) => {
      const fecha = row.fecha_modificacion ?? row.fecha_registro ?? '';
      const accion: 'Registrado' | 'Modificado' = row.fecha_modificacion
        ? 'Modificado'
        : 'Registrado';
      return {
        id: row.id,
        nombre: nombreCompleto(row),
        estado: row.estado,
        congregacion: row.nombre_congregacion ?? '-',
        fecha,
        accion,
      };
    })
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
    .slice(0, limit);
}
