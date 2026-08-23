import { Workbook } from 'exceljs';
import { Departamento, Municipio, Publicador } from './models';
import { Punto } from '../../configuracion/data/models';
import { TipoEntrenamientoFiltro, agruparPorEntrenamiento } from './entrenamiento-filter.util';
import { formatDateShort, nombreCompleto } from './publicador.utils';

const PRIMARY_ARGB = 'FF4A6DA7';
const HEADER_ROW = ['#', 'Nombre', 'Móvil', 'Congregación', 'Circuito', 'Asistió'];

export async function exportEntrenamientoChecklistToExcel(
  rows: Publicador[],
  tipo: TipoEntrenamientoFiltro,
  puntos: Punto[],
  departamentos: Departamento[],
  municipios: Municipio[],
): Promise<void> {
  const puntosPorCodigo = new Map(puntos.map((p) => [p.codigo_punto, p]));
  const departamentosPorCodigo = new Map(departamentos.map((d) => [d.codigo_departamento, d]));
  const municipiosPorCodigo = new Map(municipios.map((m) => [m.codigo_municipio, m]));
  const nombrePuntoPorCodigo = new Map(puntos.map((p) => [p.codigo_punto, p.nombre_punto]));

  const gruposOrdenados = agruparPorEntrenamiento(rows, tipo, nombrePuntoPorCodigo);

  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Lista de chequeo');
  sheet.columns = [{ width: 6 }, { width: 32 }, { width: 16 }, { width: 26 }, { width: 12 }, { width: 14 }];

  sheet.addRow([`Lista de chequeo — ${tipo}`]).font = { bold: true, size: 14 };
  const generadoEl = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
  sheet.addRow([`Generado el ${generadoEl}`]).font = { italic: true, color: { argb: 'FF5A5A5A' } };
  sheet.addRow([]);

  for (const grupo of gruposOrdenados) {
    const punto = puntosPorCodigo.get(grupo.codigoPunto);
    const nombrePunto = punto?.nombre_punto ?? `Punto ${grupo.codigoPunto}`;
    const nombreMunicipio = punto ? municipiosPorCodigo.get(punto.codigo_municipio)?.nombre_municipio : undefined;
    const nombreDepartamento = punto
      ? departamentosPorCodigo.get(punto.codigo_departamento)?.nombre_departamento
      : undefined;
    const direccion = [punto?.direccion, nombreMunicipio, nombreDepartamento].filter(Boolean).join(', ') || '—';

    sheet.addRow([`Fecha de entrenamiento: ${formatDateShort(grupo.fecha)}`]).font = { bold: true, size: 12 };
    sheet.addRow([`Lugar: ${nombrePunto}`]);
    sheet.addRow([`Dirección: ${direccion}`]);
    sheet.addRow([`Encargado del entrenamiento: ${punto?.encargado || '—'} - Móvil: ${punto?.movil || '—'}`]);

    const headerRow = sheet.addRow(HEADER_ROW);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_ARGB } };
    });

    const publicadoresOrdenados = [...grupo.publicadores].sort((a, b) =>
      nombreCompleto(a).localeCompare(nombreCompleto(b)),
    );
    publicadoresOrdenados.forEach((p, index) => {
      sheet.addRow([index + 1, nombreCompleto(p), p.movil, p.nombre_congregacion ?? '—', p.codigo_circuito ?? '—', '']);
    });

    sheet.addRow([]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const today = new Date().toISOString().slice(0, 10);
  const sufijo = tipo === 'Primer entrenamiento' ? 'primer' : 'segundo';
  downloadBlob(blob, `lista_chequeo_${sufijo}_entrenamiento_${today}.xlsx`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
