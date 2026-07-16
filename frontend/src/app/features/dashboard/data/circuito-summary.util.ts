import { Congregacion, Publicador } from '../../solicitudes/data/models';
import { nombreCompleto } from '../../solicitudes/data/publicador.utils';
import { Circuito } from '../../configuracion/data/models';

export interface SummaryCounts {
  total: number;
  primerEntrenamiento: number;
  segundoEntrenamiento: number;
  entrenamientoCompletado: number;
  privilegioMinNinguno: number;
  privilegioMinAnciano: number;
  privilegioMinSiervo: number;
  privilegioSerPublicador: number;
  privilegioSerPrecursorRegular: number;
  privilegioSerPrecursorEspecial: number;
  privilegioSerMisionero: number;
  privilegioSerBetel: number;
}

export interface PublicadorSummaryEntry {
  id: string;
  nombre: string;
  correo: string;
  movil: string;
}

export interface CongregacionSummaryRow extends SummaryCounts {
  codigoCongregacion: number;
  nombreCongregacion: string;
  publicadores: PublicadorSummaryEntry[];
}

export interface CircuitoSummaryRow extends SummaryCounts {
  codigoCircuito: string;
  nombreCircuito: string;
  congregaciones: CongregacionSummaryRow[];
}

const SIN_CIRCUITO = 'SIN-CIRCUITO';
const SIN_CONGREGACION = -1;

function emptyCounts(): SummaryCounts {
  return {
    total: 0,
    primerEntrenamiento: 0,
    segundoEntrenamiento: 0,
    entrenamientoCompletado: 0,
    privilegioMinNinguno: 0,
    privilegioMinAnciano: 0,
    privilegioMinSiervo: 0,
    privilegioSerPublicador: 0,
    privilegioSerPrecursorRegular: 0,
    privilegioSerPrecursorEspecial: 0,
    privilegioSerMisionero: 0,
    privilegioSerBetel: 0,
  };
}

function addPublicador(counts: SummaryCounts, row: Publicador): void {
  counts.total++;

  switch (row.entrenamiento_requerido) {
    case 'Primer entrenamiento':
      counts.primerEntrenamiento++;
      break;
    case 'Segundo entrenamiento':
      counts.segundoEntrenamiento++;
      break;
    case 'Entrenamiento completado':
      counts.entrenamientoCompletado++;
      break;
  }

  switch (row.privilegio_min) {
    case 'Ninguno':
      counts.privilegioMinNinguno++;
      break;
    case 'Anciano':
      counts.privilegioMinAnciano++;
      break;
    case 'Siervo ministerial':
      counts.privilegioMinSiervo++;
      break;
  }

  switch (row.privilegio_ser) {
    case 'Publicador':
      counts.privilegioSerPublicador++;
      break;
    case 'Precursor regular':
      counts.privilegioSerPrecursorRegular++;
      break;
    case 'Precursor especial':
      counts.privilegioSerPrecursorEspecial++;
      break;
    case 'Misionero que sirve en el campo':
      counts.privilegioSerMisionero++;
      break;
    case 'Miembro de la familia Betel':
      counts.privilegioSerBetel++;
      break;
  }
}

export function buildCircuitoSummary(
  publicadores: Publicador[],
  circuitos: Circuito[],
  congregaciones: Congregacion[],
): CircuitoSummaryRow[] {
  const circuitoNombres = new Map(circuitos.map((c) => [c.codigo_circuito, c.nombre_viajante]));
  const congregacionNombres = new Map(congregaciones.map((c) => [c.codigo_congregacion, c.nombre_congregacion]));

  const circuitoRows = new Map<string, CircuitoSummaryRow>();

  for (const row of publicadores) {
    const codigoCircuito = row.codigo_circuito ?? SIN_CIRCUITO;
    let circuitoRow = circuitoRows.get(codigoCircuito);
    if (!circuitoRow) {
      circuitoRow = {
        codigoCircuito,
        nombreCircuito:
          codigoCircuito === SIN_CIRCUITO
            ? 'Sin circuito'
            : (circuitoNombres.get(codigoCircuito) ? `${codigoCircuito} - ${circuitoNombres.get(codigoCircuito)}` : codigoCircuito),
        congregaciones: [],
        ...emptyCounts(),
      };
      circuitoRows.set(codigoCircuito, circuitoRow);
    }

    const codigoCongregacion = row.codigo_congregacion ?? SIN_CONGREGACION;
    let congregacionRow = circuitoRow.congregaciones.find((c) => c.codigoCongregacion === codigoCongregacion);
    if (!congregacionRow) {
      congregacionRow = {
        codigoCongregacion,
        nombreCongregacion:
          congregacionNombres.get(codigoCongregacion) ?? row.nombre_congregacion ?? 'Sin congregación',
        publicadores: [],
        ...emptyCounts(),
      };
      circuitoRow.congregaciones.push(congregacionRow);
    }

    addPublicador(circuitoRow, row);
    addPublicador(congregacionRow, row);
    congregacionRow.publicadores.push({
      id: row.id,
      nombre: nombreCompleto(row),
      correo: row.correo_electronico,
      movil: row.movil,
    });
  }

  const result = [...circuitoRows.values()];
  for (const circuitoRow of result) {
    circuitoRow.congregaciones.sort((a, b) => a.nombreCongregacion.localeCompare(b.nombreCongregacion));
    for (const congregacionRow of circuitoRow.congregaciones) {
      congregacionRow.publicadores.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
  }
  result.sort((a, b) => a.nombreCircuito.localeCompare(b.nombreCircuito));

  return result;
}
