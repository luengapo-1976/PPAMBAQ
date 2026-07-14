import { Workbook } from 'exceljs';
import { Publicador, PrivilegioMin, PrivilegioSer } from './models';
import { nombreCompleto } from './publicador.utils';

const EXCEL_HEADERS = [
  'Nombre',
  'Movil',
  'Correo electrónico',
  'Congregación',
  'Circuito',
  'Primer apellido',
  'Segundo apellido',
  'Apellido de casada',
  'Primer nombre',
  'Segundo nombre',
  'Sexo',
  'MIN',
  'PRIV.',
  'S-73',
  'MOD.',
  'USUARIO',
  'CORREO',
  'TURNOS',
];

const CSV_HEADERS = ['Primer nombre', 'Primer apellido', 'USUARIO', 'CORREO', 'Móvil', '', ''];

/** Columna "MIN": deriva de privilegio_ser. */
function mapPrivilegioSerToMin(privilegioSer: PrivilegioSer): string {
  switch (privilegioSer) {
    case 'Publicador':
      return 'PUB';
    case 'Precursor regular':
      return 'PRE';
    case 'Precursor especial':
    case 'Misionero que sirve en el campo':
      return 'MIS';
    case 'Miembro de la familia Betel':
      return 'MIN';
    default:
      return '';
  }
}

/** Columna "PRIV.": deriva de privilegio_min. */
function mapPrivilegioMinToPriv(privilegioMin: PrivilegioMin): string {
  switch (privilegioMin) {
    case 'Anciano':
      return 'ANC';
    case 'Siervo ministerial':
      return 'MIN';
    default:
      return '';
  }
}

export async function exportPublicadoresToExcel(rows: Publicador[]): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Solicitudes');

  sheet.addRow(EXCEL_HEADERS);
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow([
      nombreCompleto(row),
      row.movil,
      row.correo_electronico,
      row.nombre_congregacion ?? '',
      row.codigo_circuito ?? '',
      row.primer_apellido,
      row.segundo_apellido ?? '',
      row.apellido_casada ?? '',
      row.primer_nombre,
      row.segundo_nombre ?? '',
      row.sexo,
      mapPrivilegioSerToMin(row.privilegio_ser),
      mapPrivilegioMinToPriv(row.privilegio_min),
      row.fecha_solicitud,
      row.fecha_modificacion ?? '',
      row.login ?? '',
      row.correo_electronico,
      '',
    ]);
  }

  sheet.columns.forEach((column) => {
    column.width = 20;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    buildFileName('xlsx'),
  );
}

export function exportPublicadoresToCsv(rows: Publicador[]): void {
  const lines = [
    CSV_HEADERS,
    ...rows.map((row) => [row.primer_nombre, row.primer_apellido, row.login ?? '', row.correo_electronico, row.movil, '', '']),
  ];
  const csvContent = lines.map((line) => line.map(csvEscape).join(',')).join('\r\n');
  // BOM para que Excel detecte UTF-8 y muestre bien los acentos.
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, buildFileName('csv'));
}

function csvEscape(value: string): string {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildFileName(extension: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `solicitudes_${today}.${extension}`;
}
