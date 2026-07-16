import { PDFDocument, PDFForm } from 'pdf-lib';
import { Congregacion, Departamento, EstadoCivil, Municipio, ParticipoAntes, PrivilegioMin, PrivilegioSer, Sexo } from './models';

export interface S73ImportValues {
  primer_apellido: string;
  segundo_apellido: string;
  primer_nombre: string;
  segundo_nombre: string;
  direccion: string;
  correo_electronico: string;
  movil: string;
  codigo_departamento: string;
  codigo_municipio: string;
  codigo_congregacion: string;
  fecha_nacimiento: string;
  fecha_bautismo: string;
  sexo: Sexo | '';
  estado_civil: EstadoCivil | '';
  nombre_conyuge: string;
  apellido_casada: string;
  privilegio_min: PrivilegioMin;
  privilegio_ser: PrivilegioSer;
  participo_antes: ParticipoAntes | '';
  fecha_solicitud: string;
}

export interface S73ImportResult {
  values: S73ImportValues;
  warnings: string[];
}

/** Nombres de campo del AcroForm del formulario S-73-S (siempre el mismo formato). */
const FIELD = {
  apellidos: '900_1_Text_C',
  primerNombre: '900_2_Text_C',
  segundoNombre: '900_3_Text_C',
  direccion: '900_4_Text_C',
  correo: '900_5_Text_C',
  ciudadPersona: '900_6_Text_C',
  provinciaPersona: '900_7_Text_C',
  celular: '900_10_Text_C',
  congregacionNombre: '900_11_Text_C',
  congregacionCiudad: '900_12_Text_C',
  nacDia: '900_15_Text_C',
  nacMes: '900_16_Text_C',
  nacAnio: '900_17_Text_C',
  bautDia: '900_18_Text_C',
  bautMes: '900_19_Text_C',
  bautAnio: '900_20_Text_C',
  sexoM: '900_21_CheckBox',
  sexoF: '900_22_CheckBox',
  ecCasado: '900_23_CheckBox',
  ecSoltero: '900_24_CheckBox',
  ecDivorciado: '900_25_CheckBox',
  ecSeparado: '900_26_CheckBox',
  ecViudo: '900_27_CheckBox',
  nombreConyuge: '900_28_Text_C',
  sirveMisionero: '900_29_CheckBox',
  sirvePrecursorEspecial: '900_30_CheckBox',
  sirveBetel: '900_31_CheckBox',
  sirvePrecursorRegular: '900_32_CheckBox',
  sirvePublicador: '900_33_CheckBox',
  sirveAnciano: '900_34_CheckBox',
  sirveSiervoMinisterial: '900_35_CheckBox',
  participoSi: '900_38_CheckBox',
  participoNo: '900_39_CheckBox',
  fechaFirma: '900_49_Text_C',
} as const;

function getText(form: PDFForm, name: string): string {
  try {
    return form.getTextField(name).getText()?.trim() ?? '';
  } catch {
    return '';
  }
}

function isChecked(form: PDFForm, name: string): boolean {
  try {
    return form.getCheckBox(name).isChecked();
  } catch {
    return false;
  }
}

function splitApellidos(apellidos: string): { primero: string; segundo: string } {
  const trimmed = apellidos.trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return { primero: trimmed, segundo: '' };
  }
  return { primero: trimmed.slice(0, spaceIndex), segundo: trimmed.slice(spaceIndex + 1).trim() };
}

function buildIsoDate(dia: string, mes: string, anio: string): string {
  if (!/^\d{1,2}$/.test(dia.trim()) || !/^\d{1,2}$/.test(mes.trim()) || !/^\d{4}$/.test(anio.trim())) {
    return '';
  }
  const iso = `${anio.trim()}-${mes.trim().padStart(2, '0')}-${dia.trim().padStart(2, '0')}`;
  return Number.isNaN(new Date(iso).getTime()) ? '' : iso;
}

/** La fecha de firma viene como "DD-MM-AAAA" o "DD/MM/AAAA". */
function parseFechaFirma(value: string): string {
  const match = value.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (!match) {
    return '';
  }
  const [, dia, mes, anio] = match;
  return buildIsoDate(dia, mes, anio);
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Match aproximado: primero exacto (normalizado); si no hay, substring en cualquier dirección. */
function matchByName<T>(target: string, items: T[], getName: (item: T) => string): T[] {
  const norm = normalize(target);
  if (!norm) {
    return [];
  }
  const exact = items.filter((item) => normalize(getName(item)) === norm);
  if (exact.length > 0) {
    return exact;
  }
  return items.filter((item) => {
    const itemNorm = normalize(getName(item));
    return itemNorm.includes(norm) || norm.includes(itemNorm);
  });
}

function resolveSingle<T>(matches: T[]): T | null {
  return matches.length === 1 ? matches[0] : null;
}

export async function parseS73Pdf(
  fileBytes: ArrayBuffer,
  departamentos: Departamento[],
  municipios: Municipio[],
  congregaciones: Congregacion[],
): Promise<S73ImportResult> {
  const warnings: string[] = [];
  const doc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  const form = doc.getForm();

  const { primero: primerApellido, segundo: segundoApellido } = splitApellidos(getText(form, FIELD.apellidos));

  const provinciaPersona = getText(form, FIELD.provinciaPersona);
  const ciudadPersona = getText(form, FIELD.ciudadPersona);
  const departamento = resolveSingle(matchByName(provinciaPersona, departamentos, (d) => d.nombre_departamento));
  if (!departamento && provinciaPersona) {
    warnings.push(`No se encontró el departamento "${provinciaPersona}"; selecciónalo manualmente.`);
  }
  const municipioCandidatos = departamento
    ? municipios.filter((m) => m.codigo_departamento === departamento.codigo_departamento)
    : municipios;
  const municipio = resolveSingle(matchByName(ciudadPersona, municipioCandidatos, (m) => m.nombre_municipio));
  if (!municipio && ciudadPersona) {
    warnings.push(`No se encontró el municipio "${ciudadPersona}"; selecciónalo manualmente.`);
  }

  const nombreCongregacion = getText(form, FIELD.congregacionNombre);
  const ciudadCongregacion = getText(form, FIELD.congregacionCiudad);
  const congMatches = matchByName(nombreCongregacion, congregaciones, (c) => c.nombre_congregacion);
  let congregacion = resolveSingle(congMatches);
  if (!congregacion && congMatches.length > 1) {
    const narrowed = congMatches.filter((c) => {
      const muni = municipios.find((m) => m.codigo_municipio === c.codigo_municipio);
      return muni ? matchByName(ciudadCongregacion, [muni], (m) => m.nombre_municipio).length > 0 : false;
    });
    congregacion = resolveSingle(narrowed);
  }
  if (!congregacion && nombreCongregacion) {
    warnings.push(`No se encontró la congregación "${nombreCongregacion}"; selecciónala manualmente.`);
  }

  const sexo: Sexo | '' = isChecked(form, FIELD.sexoM) ? 'M' : isChecked(form, FIELD.sexoF) ? 'F' : '';
  if (!sexo) {
    warnings.push('No se detectó el sexo marcado en el PDF; selecciónalo manualmente.');
  }

  const estadoCivilChecks: [string, EstadoCivil][] = [
    [FIELD.ecCasado, 'Casado'],
    [FIELD.ecSoltero, 'Soltero'],
    [FIELD.ecDivorciado, 'Divorciado'],
    [FIELD.ecSeparado, 'Separado'],
    [FIELD.ecViudo, 'Viudo'],
  ];
  const matchedEstadoCivil = estadoCivilChecks.find(([field]) => isChecked(form, field));
  const estadoCivil: EstadoCivil | '' = matchedEstadoCivil ? matchedEstadoCivil[1] : '';
  if (!estadoCivil) {
    warnings.push('No se detectó el estado civil marcado en el PDF; selecciónalo manualmente.');
  }

  /** "Sirve como" trae 7 casillas en un solo grupo del PDF, pero la app las separa en dos
   * campos: privilegio_min (Anciano/Siervo ministerial) y privilegio_ser (las otras 5). */
  const privilegioMin: PrivilegioMin = isChecked(form, FIELD.sirveAnciano)
    ? 'Anciano'
    : isChecked(form, FIELD.sirveSiervoMinisterial)
      ? 'Siervo ministerial'
      : 'Ninguno';

  const privilegioSerChecks: [string, PrivilegioSer][] = [
    [FIELD.sirveMisionero, 'Misionero que sirve en el campo'],
    [FIELD.sirvePrecursorEspecial, 'Precursor especial'],
    [FIELD.sirveBetel, 'Miembro de la familia Betel'],
    [FIELD.sirvePrecursorRegular, 'Precursor regular'],
    [FIELD.sirvePublicador, 'Publicador'],
  ];
  const matchedPrivilegioSer = privilegioSerChecks.find(([field]) => isChecked(form, field));
  const privilegioSer: PrivilegioSer = matchedPrivilegioSer ? matchedPrivilegioSer[1] : 'Publicador';

  const participoAntes: ParticipoAntes | '' = isChecked(form, FIELD.participoSi)
    ? 'SI'
    : isChecked(form, FIELD.participoNo)
      ? 'NO'
      : '';
  if (!participoAntes) {
    warnings.push('No se detectó si participó antes en la predicación pública especial; selecciónalo manualmente.');
  }

  const fechaNacimiento = buildIsoDate(getText(form, FIELD.nacDia), getText(form, FIELD.nacMes), getText(form, FIELD.nacAnio));
  if (!fechaNacimiento) {
    warnings.push('No se pudo leer la fecha de nacimiento; complétala manualmente.');
  }
  const fechaBautismo = buildIsoDate(getText(form, FIELD.bautDia), getText(form, FIELD.bautMes), getText(form, FIELD.bautAnio));
  if (!fechaBautismo) {
    warnings.push('No se pudo leer la fecha de bautismo; complétala manualmente.');
  }

  const fechaSolicitud = parseFechaFirma(getText(form, FIELD.fechaFirma));
  if (!fechaSolicitud) {
    warnings.push('No se pudo leer la fecha de firma; completa la fecha de solicitud manualmente.');
  }

  return {
    values: {
      primer_apellido: primerApellido,
      segundo_apellido: segundoApellido,
      primer_nombre: getText(form, FIELD.primerNombre),
      segundo_nombre: getText(form, FIELD.segundoNombre),
      direccion: getText(form, FIELD.direccion),
      correo_electronico: getText(form, FIELD.correo),
      movil: getText(form, FIELD.celular).replace(/\D/g, ''),
      codigo_departamento: departamento?.codigo_departamento ?? '',
      codigo_municipio: municipio?.codigo_municipio ?? '',
      codigo_congregacion: congregacion ? String(congregacion.codigo_congregacion) : '',
      fecha_nacimiento: fechaNacimiento,
      fecha_bautismo: fechaBautismo,
      sexo,
      estado_civil: estadoCivil,
      nombre_conyuge: getText(form, FIELD.nombreConyuge),
      apellido_casada: '',
      privilegio_min: privilegioMin,
      privilegio_ser: privilegioSer,
      participo_antes: participoAntes,
      fecha_solicitud: fechaSolicitud,
    },
    warnings,
  };
}
