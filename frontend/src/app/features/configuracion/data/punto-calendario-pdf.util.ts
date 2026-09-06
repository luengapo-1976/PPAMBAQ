import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Punto } from './models';
import { TurnoResumen } from '../../solicitar-turno/data/models';
import { etiquetaDisponibilidad, formatHoraAmPm } from '../../../shared/utils/format.util';

const PRIMARY_RGB: [number, number, number] = [74, 109, 167];
const TEXT_RGB: [number, number, number] = [37, 37, 37];
const GREEN_RGB: [number, number, number] = [81, 155, 109];
const ALT_ROW_RGB: [number, number, number] = [250, 250, 251];
const CELL_FONT_SIZE = 7.5;
const CELL_LINE_HEIGHT = CELL_FONT_SIZE * 1.15;
const CELL_PADDING = 5;
const HORA_COL_WIDTH = 85;

export interface FilaCalendarioPdf {
  horaInicio: string;
  horaFin: string;
  celdas: TurnoResumen[][];
}

interface ExportPuntoCalendarioParams {
  punto: Punto;
  nombreDepartamento: string;
  nombreMunicipio: string;
  filas: FilaCalendarioPdf[];
  diasSemana: string[];
}

interface CeldaLinea {
  texto: string;
  bold: boolean;
  color: [number, number, number];
}

/** Parte un texto en tantas líneas físicas como haga falta para caber en maxWidth
 * (con la fuente/estilo ya activos en doc), conservando el mismo negrita/color en
 * cada línea resultante. Así, un nombre, congregación o etiqueta "Disponible…" más
 * ancho que la columna se reparte en 2 (o más) líneas en vez de desbordarse. */
function agregarLineasEnvueltas(
  doc: jsPDF,
  lineas: CeldaLinea[],
  texto: string,
  bold: boolean,
  color: [number, number, number],
  maxWidth: number,
): void {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  const partes = doc.splitTextToSize(texto, maxWidth) as string[];
  for (const parte of partes) {
    lineas.push({ texto: parte, bold, color });
  }
}

/** Una línea (o varias, si no cabe en el ancho de la columna) por dato a mostrar: el
 * nombre del publicador en negrita, "Disponible…" en verde y negrita (igual criterio
 * que en pantalla), el resto en texto normal. Se usa tanto para el string plano que
 * arma el ancho/alto de la celda como para el redibujado con estilos mixtos en
 * didDrawCell — por eso ambos deben recibir el mismo maxWidth. */
function celdaLineas(doc: jsPDF, turnos: TurnoResumen[], maxWidth: number): CeldaLinea[] {
  if (turnos.length === 0) {
    return [{ texto: '-', bold: false, color: TEXT_RGB }];
  }
  const lineas: CeldaLinea[] = [];
  turnos.forEach((turno, index) => {
    if (index > 0) {
      lineas.push({ texto: '', bold: false, color: TEXT_RGB });
    }
    if (turno.disponibilidad === 'ocupado') {
      agregarLineasEnvueltas(
        doc,
        lineas,
        turno.nombreCortoOcupante || 'Publicador asignado',
        true,
        TEXT_RGB,
        maxWidth,
      );
      agregarLineasEnvueltas(doc, lineas, turno.movilOcupante || '-', false, TEXT_RGB, maxWidth);
      agregarLineasEnvueltas(
        doc,
        lineas,
        turno.congregacionOcupante || '-',
        false,
        TEXT_RGB,
        maxWidth,
      );
    } else {
      agregarLineasEnvueltas(
        doc,
        lineas,
        etiquetaDisponibilidad(turno.disponibilidad),
        true,
        GREEN_RGB,
        maxWidth,
      );
    }
  });
  doc.setFont('helvetica', 'normal');
  return lineas;
}

function celdaTexto(doc: jsPDF, turnos: TurnoResumen[], maxWidth: number): string {
  return celdaLineas(doc, turnos, maxWidth)
    .map((linea) => linea.texto)
    .join('\n');
}

export async function exportPuntoCalendarioToPdf(
  params: ExportPuntoCalendarioParams,
): Promise<void> {
  const { punto, nombreDepartamento, nombreMunicipio, filas, diasSemana } = params;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...PRIMARY_RGB);
  doc.rect(0, 0, pageWidth, 54, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`PPAM - Calendario de ${punto.nombre_punto}`, 24, 24);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const generatedAt = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
  doc.text(`Generado el ${generatedAt}`, 24, 40);

  doc.setTextColor(37, 37, 37);
  doc.setFontSize(9);
  const direccion = punto.direccion || 'Sin dirección registrada';
  doc.text(`${direccion} · ${nombreMunicipio}, ${nombreDepartamento}`, 24, 68);

  const infoY = 82;
  let infoX = 24;
  const encargadoTexto = punto.encargado || 'Sin encargado registrado';
  const movilTexto = punto.movil || '-';
  doc.setFont('helvetica', 'bold');
  doc.text('Encargado: ', infoX, infoY);
  infoX += doc.getTextWidth('Encargado: ');
  doc.setFont('helvetica', 'normal');
  doc.text(encargadoTexto, infoX, infoY);
  infoX += doc.getTextWidth(encargadoTexto) + 24;
  doc.setFont('helvetica', 'bold');
  doc.text('Móvil: ', infoX, infoY);
  infoX += doc.getTextWidth('Móvil: ');
  doc.setFont('helvetica', 'normal');
  doc.text(movilTexto, infoX, infoY);

  /** Ancho de columna de día fijado explícitamente (no autocalculado por autoTable):
   * así se conoce de antemano el ancho disponible para el texto, necesario para
   * decidir dónde partir en 2 líneas un nombre, congregación o etiqueta "Disponible…"
   * que no quepa — tanto al construir `body` (de donde autoTable calcula el alto de
   * cada fila) como al redibujar el contenido en didDrawCell. */
  const margenHorizontal = 24;
  const diaColWidth = (pageWidth - margenHorizontal * 2 - HORA_COL_WIDTH) / diasSemana.length;
  const diaColTextWidth = diaColWidth - CELL_PADDING * 2;

  doc.setFontSize(CELL_FONT_SIZE);
  const head = ['Rango de horas', ...diasSemana];
  const body = filas.map((fila) => [
    `${formatHoraAmPm(fila.horaInicio)} – ${formatHoraAmPm(fila.horaFin)}`,
    ...fila.celdas.map((celdas) => celdaTexto(doc, celdas, diaColTextWidth)),
  ]);

  autoTable(doc, {
    startY: 96,
    head: [head],
    body,
    /** Evita que una fila (un rango de horas) quede partida entre dos páginas: si no
     * cabe completa en la página actual, se empuja entera a la siguiente. */
    rowPageBreak: 'avoid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 5,
      textColor: [37, 37, 37],
      /** Mismo tono que --ppam-outline-variant, usado en pantalla para las líneas
       * divisorias de filas/columnas y el borde exterior del calendario. */
      lineColor: [195, 198, 209],
      lineWidth: 0.75,
      valign: 'middle',
      halign: 'center',
    },
    headStyles: {
      fillColor: PRIMARY_RGB,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: HORA_COL_WIDTH, fontStyle: 'bold' },
      1: { cellWidth: diaColWidth },
      2: { cellWidth: diaColWidth },
      3: { cellWidth: diaColWidth },
      4: { cellWidth: diaColWidth },
      5: { cellWidth: diaColWidth },
      6: { cellWidth: diaColWidth },
      7: { cellWidth: diaColWidth },
    },
    bodyStyles: { halign: 'center' },
    alternateRowStyles: { fillColor: ALT_ROW_RGB },
    margin: { left: margenHorizontal, right: margenHorizontal },
    /** jsPDF-autotable dibuja el texto de cada celda con un único estilo; para poder
     * poner el nombre del publicador en negrita y "Disponible…" en verde y negrita
     * dentro de la misma celda, se repinta el interior (sin tocar el borde) y se
     * redibuja línea por línea con el estilo que corresponda a cada una. Las celdas
     * vacías ("—") se dejan tal cual las dibujó autoTable, sin intervenir. */
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index === 0) {
        return;
      }
      const turnos = filas[data.row.index]?.celdas[data.column.index - 1] ?? [];
      if (turnos.length === 0) {
        return;
      }
      const lineas = celdaLineas(doc, turnos, diaColTextWidth);

      const inset = 0.6;
      const isAltRow = data.row.index % 2 === 1;
      const bg = isAltRow ? ALT_ROW_RGB : ([255, 255, 255] as [number, number, number]);
      doc.setFillColor(...bg);
      doc.rect(
        data.cell.x + inset,
        data.cell.y + inset,
        data.cell.width - inset * 2,
        data.cell.height - inset * 2,
        'F',
      );

      const totalHeight = lineas.length * CELL_LINE_HEIGHT;
      const centerX = data.cell.x + data.cell.width / 2;
      let y = data.cell.y + (data.cell.height - totalHeight) / 2 + CELL_LINE_HEIGHT * 0.8;
      doc.setFontSize(CELL_FONT_SIZE);
      for (const linea of lineas) {
        if (linea.texto) {
          doc.setFont('helvetica', linea.bold ? 'bold' : 'normal');
          doc.setTextColor(...linea.color);
          doc.text(linea.texto, centerX, y, { align: 'center' });
        }
        y += CELL_LINE_HEIGHT;
      }
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_RGB);
    },
  });

  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      'Predicación Pública de Área Metropolitana Barranquilla (PPAM BAQ)',
      24,
      pageHeight - 16,
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 24, pageHeight - 16, { align: 'right' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const nombreArchivo = punto.nombre_punto.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  doc.save(`calendario_${nombreArchivo}_${today}.pdf`);
}
