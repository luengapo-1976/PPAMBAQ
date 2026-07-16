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

function wordSimilarity(a: string, b: string): number {
  if (!a || !b) {
    return 0;
  }
  if (a === b) {
    return 1;
  }
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/** Compara dos nombres completos ignorando el orden de las palabras (p. ej. quién
 * queda como "primer nombre" o "primer apellido" al momento de digitarlo), ya que
 * la misma persona puede quedar registrada con sus nombres/apellidos intercambiados.
 * Para cada palabra del nombre más corto, busca su mejor coincidencia en el más largo
 * y promedia esos puntajes — así nombres/apellidos adicionales no vistos (p. ej. un
 * segundo nombre que el usuario aún no diligenció) no penalizan el puntaje. */
function nameSimilarity(a: string, b: string): number {
  const tokensA = normalize(a).split(' ').filter(Boolean);
  const tokensB = normalize(b).split(' ').filter(Boolean);
  if (tokensA.length === 0 || tokensB.length === 0) {
    return 0;
  }

  const [shorter, longer] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  const usedIndices = new Set<number>();
  let totalScore = 0;

  for (const token of shorter) {
    let bestScore = 0;
    let bestIndex = -1;
    longer.forEach((candidate, index) => {
      if (usedIndices.has(index)) {
        return;
      }
      const score = wordSimilarity(token, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    if (bestIndex >= 0) {
      usedIndices.add(bestIndex);
    }
    totalScore += bestScore;
  }

  return totalScore / shorter.length;
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
  /** La búsqueda por similitud de nombre solo aplica cuando primer nombre y primer
   * apellido están poblados; móvil y correo se validan de forma independiente. */
  const buscarPorNombre = input.primerNombre.trim().length > 0 && input.primerApellido.trim().length > 0;
  const movilActual = input.movil.trim();
  const correoActual = normalize(input.correoElectronico);

  const results = new Map<string, DuplicateCandidate>();

  for (const publicador of existing) {
    if (excludeId && publicador.id === excludeId) {
      continue;
    }
    const reasons: DuplicateReason[] = [];

    if (buscarPorNombre) {
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
