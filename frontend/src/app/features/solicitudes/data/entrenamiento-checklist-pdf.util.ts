import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Departamento, Municipio, Publicador } from './models';
import { Punto } from '../../configuracion/data/models';
import { TipoEntrenamientoFiltro, agruparPorEntrenamiento } from './entrenamiento-filter.util';
import { formatDateShort, nombreCompleto } from './publicador.utils';

const PRIMARY_RGB: [number, number, number] = [74, 109, 167];
const PAGE_MARGIN = 32;

export async function exportEntrenamientoChecklistToPdf(
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

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(...PRIMARY_RGB);
  doc.rect(0, 0, pageWidth, 58, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`Lista de chequeo - ${tipo}`, PAGE_MARGIN, 26);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const generadoEl = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
  doc.text(`Generado el ${generadoEl}`, PAGE_MARGIN, 44);

  let cursorY = 78;

  for (const grupo of gruposOrdenados) {
    const punto = puntosPorCodigo.get(grupo.codigoPunto);
    const nombrePunto = punto?.nombre_punto ?? `Punto ${grupo.codigoPunto}`;
    const nombreMunicipio = punto ? municipiosPorCodigo.get(punto.codigo_municipio)?.nombre_municipio : undefined;
    const nombreDepartamento = punto
      ? departamentosPorCodigo.get(punto.codigo_departamento)?.nombre_departamento
      : undefined;
    const direccion = [punto?.direccion, nombreMunicipio, nombreDepartamento].filter(Boolean).join(', ') || '-';

    if (cursorY > pageHeight - 170) {
      doc.addPage();
      cursorY = 32;
    }

    doc.setTextColor(37, 37, 37);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Fecha de entrenamiento: ${formatDateShort(grupo.fecha)}`, PAGE_MARGIN, cursorY);
    cursorY += 16;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    doc.text(`Lugar: ${nombrePunto}`, PAGE_MARGIN, cursorY);
    cursorY += 13;
    doc.text(`Dirección: ${direccion}`, PAGE_MARGIN, cursorY);
    cursorY += 13;
    doc.text(`Encargado del entrenamiento: ${punto?.encargado || '-'} - Móvil: ${punto?.movil || '-'}`, PAGE_MARGIN, cursorY);
    cursorY += 13;

    // Una línea de espacio antes de la tabla.
    cursorY += 13;

    const publicadoresOrdenados = [...grupo.publicadores].sort((a, b) =>
      nombreCompleto(a).localeCompare(nombreCompleto(b)),
    );

    autoTable(doc, {
      startY: cursorY,
      head: [['#', 'Nombre', 'Móvil', 'Congregación', 'Circuito', 'Asistió']],
      body: publicadoresOrdenados.map((p, index) => [
        index + 1,
        nombreCompleto(p),
        p.movil,
        p.nombre_congregacion ?? '-',
        p.codigo_circuito ?? '-',
        '',
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 4,
        textColor: [37, 37, 37],
        lineColor: [225, 228, 233],
        lineWidth: 0.5,
      },
      headStyles: { fillColor: PRIMARY_RGB, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 24, halign: 'center' },
        5: { cellWidth: 50, halign: 'center' },
      },
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('PPAM BAQ - Lista de chequeo de entrenamiento', PAGE_MARGIN, pageHeight - 16);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - PAGE_MARGIN, pageHeight - 16, { align: 'right' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const sufijo = tipo === 'Primer entrenamiento' ? 'primer' : 'segundo';
  doc.save(`lista_chequeo_${sufijo}_entrenamiento_${today}.pdf`);
}
