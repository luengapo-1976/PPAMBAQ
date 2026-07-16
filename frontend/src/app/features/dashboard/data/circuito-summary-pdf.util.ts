import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CircuitoSummaryRow, SummaryCounts } from './circuito-summary.util';

const PRIMARY_RGB: [number, number, number] = [74, 109, 167];
const CIRCUITO_ROW_BG: [number, number, number] = [230, 236, 245];
const TOTAL_ROW_BG: [number, number, number] = [217, 226, 240];

const COLUMN_HEADS = [
  'Circuito / Congregación',
  'Total',
  '1er entren.',
  '2do entren.',
  'Completado',
  'Ninguno',
  'Anciano',
  'Siervo min.',
  'Publicador',
  'Precursor reg.',
  'Precursor esp.',
  'Misionero',
  'Betel',
];

function countsToCells(counts: SummaryCounts): (string | number)[] {
  return [
    counts.total,
    counts.primerEntrenamiento,
    counts.segundoEntrenamiento,
    counts.entrenamientoCompletado,
    counts.privilegioMinNinguno,
    counts.privilegioMinAnciano,
    counts.privilegioMinSiervo,
    counts.privilegioSerPublicador,
    counts.privilegioSerPrecursorRegular,
    counts.privilegioSerPrecursorEspecial,
    counts.privilegioSerMisionero,
    counts.privilegioSerBetel,
  ];
}

type RowStyle = 'circuito' | 'congregacion' | 'total';

export async function exportCircuitoSummaryToPdf(
  rows: CircuitoSummaryRow[],
  totals: SummaryCounts,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...PRIMARY_RGB);
  doc.rect(0, 0, pageWidth, 54, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PPAM — Resumen por circuito', 32, 28);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const generatedAt = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
  doc.text(`Generado el ${generatedAt}`, 32, 44);

  const body: { cells: (string | number)[]; style: RowStyle }[] = [];
  for (const circuito of rows) {
    body.push({ cells: [circuito.nombreCircuito, ...countsToCells(circuito)], style: 'circuito' });
    for (const congregacion of circuito.congregaciones) {
      body.push({
        cells: [`   ${congregacion.nombreCongregacion}`, ...countsToCells(congregacion)],
        style: 'congregacion',
      });
    }
  }
  body.push({ cells: ['Total general', ...countsToCells(totals)], style: 'total' });

  autoTable(doc, {
    startY: 70,
    head: [COLUMN_HEADS],
    body: body.map((row) => row.cells),
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      textColor: [37, 37, 37],
      lineColor: [225, 228, 233],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: PRIMARY_RGB,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 190 },
    },
    bodyStyles: { halign: 'center' },
    alternateRowStyles: { fillColor: [250, 250, 251] },
    didParseCell: (data) => {
      if (data.section !== 'body') {
        return;
      }
      const rowMeta = body[data.row.index];
      if (!rowMeta) {
        return;
      }
      if (rowMeta.style === 'circuito') {
        data.cell.styles.fillColor = CIRCUITO_ROW_BG;
        data.cell.styles.fontStyle = 'bold';
      } else if (rowMeta.style === 'total') {
        data.cell.styles.fillColor = TOTAL_ROW_BG;
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.column.index === 0) {
        data.cell.styles.halign = 'left';
      }
    },
    margin: { left: 32, right: 32 },
  });

  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('Predicación Pública de Área Metropolitana Barranquilla (PPAM BAQ)', 32, pageHeight - 16);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 32, pageHeight - 16, { align: 'right' });
  }

  const today = new Date().toISOString().slice(0, 10);
  doc.save(`resumen_circuitos_${today}.pdf`);
}
