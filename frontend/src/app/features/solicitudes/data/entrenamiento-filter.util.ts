import { Publicador } from './models';

export type TipoEntrenamientoFiltro = 'Primer entrenamiento' | 'Segundo entrenamiento';

export interface EntrenamientoFiltro {
  tipo: TipoEntrenamientoFiltro | null;
  fecha: string | null;
  codigoPunto: number | null;
}

export const EMPTY_ENTRENAMIENTO_FILTRO: EntrenamientoFiltro = {
  tipo: null,
  fecha: null,
  codigoPunto: null,
};

export function fechaCampo(tipo: TipoEntrenamientoFiltro): 'fecha_primera_capacitacion' | 'fecha_segunda_capacitacion' {
  return tipo === 'Primer entrenamiento' ? 'fecha_primera_capacitacion' : 'fecha_segunda_capacitacion';
}

export function lugarCampo(tipo: TipoEntrenamientoFiltro): 'lugar_primera_capacitacion' | 'lugar_segunda_capacitacion' {
  return tipo === 'Primer entrenamiento' ? 'lugar_primera_capacitacion' : 'lugar_segunda_capacitacion';
}

export function fechasDisponibles(rows: Publicador[], tipo: TipoEntrenamientoFiltro | null): string[] {
  if (!tipo) {
    return [];
  }
  const campo = fechaCampo(tipo);
  const fechas = new Set<string>();
  for (const row of rows) {
    const valor = row[campo];
    if (valor) {
      fechas.add(valor);
    }
  }
  return [...fechas].sort();
}

export function lugaresDisponibles(
  rows: Publicador[],
  tipo: TipoEntrenamientoFiltro | null,
  fecha: string | null,
): number[] {
  if (!tipo) {
    return [];
  }
  const campoFecha = fechaCampo(tipo);
  const campoLugar = lugarCampo(tipo);
  const lugares = new Set<number>();
  for (const row of rows) {
    if (fecha && row[campoFecha] !== fecha) {
      continue;
    }
    const lugar = row[campoLugar];
    if (lugar != null) {
      lugares.add(lugar);
    }
  }
  return [...lugares];
}

export interface GrupoEntrenamiento {
  fecha: string;
  codigoPunto: number;
  publicadores: Publicador[];
}

/** Agrupa por fecha+lugar de entrenamiento (misma agrupación que usan tanto el PDF
 * como el Excel de la lista de chequeo), ordenado por fecha y luego por nombre de
 * punto, para que el rompimiento del listado sea idéntico en ambos formatos. */
export function agruparPorEntrenamiento(
  rows: Publicador[],
  tipo: TipoEntrenamientoFiltro,
  nombrePuntoPorCodigo: Map<number, string>,
): GrupoEntrenamiento[] {
  const campoFecha = fechaCampo(tipo);
  const campoLugar = lugarCampo(tipo);
  const grupos = new Map<string, GrupoEntrenamiento>();

  for (const row of rows) {
    const fecha = row[campoFecha];
    const codigoPunto = row[campoLugar];
    if (!fecha || codigoPunto == null) {
      continue;
    }
    const key = `${fecha}|${codigoPunto}`;
    const grupo = grupos.get(key);
    if (grupo) {
      grupo.publicadores.push(row);
    } else {
      grupos.set(key, { fecha, codigoPunto, publicadores: [row] });
    }
  }

  return [...grupos.values()].sort((a, b) => {
    if (a.fecha !== b.fecha) {
      return a.fecha.localeCompare(b.fecha);
    }
    const nombreA = nombrePuntoPorCodigo.get(a.codigoPunto) ?? '';
    const nombreB = nombrePuntoPorCodigo.get(b.codigoPunto) ?? '';
    return nombreA.localeCompare(nombreB);
  });
}

/** Solo incluye publicadores con fecha y lugar asignados para el tipo de entrenamiento elegido,
 * ya que este filtro existe para producir la lista de asistencia de un entrenamiento programado. */
export function applyEntrenamientoFiltro(rows: Publicador[], filtro: EntrenamientoFiltro): Publicador[] {
  if (!filtro.tipo) {
    return rows;
  }
  const campoFecha = fechaCampo(filtro.tipo);
  const campoLugar = lugarCampo(filtro.tipo);
  return rows.filter((row) => {
    const fecha = row[campoFecha];
    if (!fecha) {
      return false;
    }
    if (filtro.fecha && fecha !== filtro.fecha) {
      return false;
    }
    const lugar = row[campoLugar];
    if (lugar == null) {
      return false;
    }
    if (filtro.codigoPunto != null && lugar !== filtro.codigoPunto) {
      return false;
    }
    return true;
  });
}
