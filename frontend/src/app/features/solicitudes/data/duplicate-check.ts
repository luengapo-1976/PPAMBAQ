import { Publicador } from './models';
import { nombreCompleto } from './publicador.utils';

const NAME_SIMILARITY_THRESHOLD = 0.82;
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export type DuplicateReason = 'nombre' | 'movil' | 'correo';

export interface DuplicateCandidate {
  publicador: Publicador;
  reasons: DuplicateReason[];
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }

  return matrix[rows - 1][cols - 1];
}

function nameSimilarity(a: string, b: string): number {
  const normA = normalize(a);
  const normB = normalize(b);
  if (!normA || !normB) {
    return 0;
  }
  if (normA === normB) {
    return 1;
  }
  const maxLen = Math.max(normA.length, normB.length);
  const distance = levenshteinDistance(normA, normB);
  return 1 - distance / maxLen;
}

export interface DuplicateSearchInput {
  primerApellido: string;
  segundoApellido: string;
  primerNombre: string;
  segundoNombre: string;
  movil: string;
  correoElectronico: string;
}

export function findDuplicateCandidates(
  input: DuplicateSearchInput,
  existing: Publicador[],
  excludeId: string | null,
): DuplicateCandidate[] {
  const nombreActual = [input.primerNombre, input.segundoNombre, input.primerApellido, input.segundoApellido]
    .filter((part) => !!part && part.trim().length > 0)
    .join(' ');
  const movilActual = input.movil.trim();
  const correoActual = normalize(input.correoElectronico);

  const results = new Map<string, DuplicateCandidate>();

  for (const publicador of existing) {
    if (excludeId && publicador.id === excludeId) {
      continue;
    }
    const reasons: DuplicateReason[] = [];

    if (nombreActual.trim().length > 0) {
      const similarity = nameSimilarity(nombreActual, nombreCompleto(publicador));
      if (similarity >= NAME_SIMILARITY_THRESHOLD) {
        reasons.push('nombre');
      }
    }

    if (movilActual.length > 0 && publicador.movil?.trim() === movilActual) {
      reasons.push('movil');
    }

    if (correoActual.length > 0 && normalize(publicador.correo_electronico ?? '') === correoActual) {
      reasons.push('correo');
    }

    if (reasons.length > 0) {
      results.set(publicador.id, { publicador, reasons });
    }
  }

  return [...results.values()];
}
