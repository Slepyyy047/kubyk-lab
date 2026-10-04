import { colors, faces, type Color, type Face } from './cube';

export type PuzzleSize = 2 | 3 | 4;
export interface PuzzleMove { face: Face; depth: number; turns: 1 | -1 | 2 }
export interface PuzzleState { size: PuzzleSize; stickers: Color[] }
export type Vec3 = [number, number, number];

const faceColors: Record<Face, Color> = {
  U: 'white', R: 'red', F: 'green', D: 'yellow', L: 'orange', B: 'blue',
};
const colorValues = Object.keys(colors) as Color[];
const faceAxis: Record<Face, 0 | 1 | 2> = { R: 0, L: 0, U: 1, D: 1, F: 2, B: 2 };
const faceSign: Record<Face, 1 | -1> = { R: 1, L: -1, U: 1, D: -1, F: 1, B: -1 };

export function faceNormal(face: Face): Vec3 {
  const normal: Vec3 = [0, 0, 0];
  normal[faceAxis[face]] = faceSign[face];
  return normal;
}

function validateSize(size: number): asserts size is PuzzleSize {
  if (size !== 2 && size !== 3 && size !== 4) throw new RangeError('Розмір кубика має бути 2, 3 або 4.');
}

function coordinate(size: PuzzleSize, offset: number): number {
  return -(size - 1) + 2 * offset;
}

/** Return a facelet's integer-grid position and outward normal in URFDLB order. */
export function stickerPose(size: PuzzleSize, index: number): { position: Vec3; normal: Vec3 } {
  validateSize(size);
  const faceArea = size * size;
  if (!Number.isInteger(index) || index < 0 || index >= faceArea * 6) throw new RangeError('Індекс наліпки поза межами кубика.');
  const face = faces[Math.floor(index / faceArea)];
  const local = index % faceArea;
  const row = Math.floor(local / size);
  const column = local % size;
  const max = size - 1;
  const x = coordinate(size, column);
  const y = max - 2 * row;
  const z = coordinate(size, row);
  switch (face) {
    case 'U': return { position: [x, max, z], normal: [0, 1, 0] };
    case 'R': return { position: [max, y, max - 2 * column], normal: [1, 0, 0] };
    case 'F': return { position: [x, y, max], normal: [0, 0, 1] };
    case 'D': return { position: [x, -max, max - 2 * row], normal: [0, -1, 0] };
    case 'L': return { position: [-max, y, coordinate(size, column)], normal: [-1, 0, 0] };
    case 'B': return { position: [max - 2 * column, y, -max], normal: [0, 0, -1] };
  }
}

function poseKey(position: readonly number.normal), index);
    }
    poseIndexesBySize.set(size, poseIndexes);
  }
  return poseIndexes.get(poseKey(position, normal));
}

const poseIndexesBySize = new Map<PuzzleSize, Map<string, number>>();

export function solvedPuzzle(size: PuzzleSize): PuzzleState {
  validateSize(size);
  const area = size * size;
  return {
    size,
    stickers: faces.flatMap((face) => Array<Color>(area).fill(faceColors[face])),
  };
}

function rotateQuarter(vector: Vec3, axis: 0 | 1 | 2, quarterTurns: 1 | -1): Vec3 {
  const [x, y, z] = vector;
  if (axis === 0) return quarterTurns === 1 ? [x, -z, y] : [x, z, -y];
  if (axis === 1) return quarterTurns === 1 ? [z, y, -x] : [-z, y, x];
  return quarterTurns === 1 ? [-y, x, z] : [y, -x, z];
}

functiosize);
  const total = state.size * state.size * 6;
  if (state.stickers.length !== total || state.stickers.some((color) => !colorValues.includes(color))) {
    throw new RangeError('Стан кубика має містити правильну кількість кольорових наліпок.');
  t stickers = Array<Color>(total);
  for (let index = 0; index < total; index += 1) {
    const pose = stickerPose(state.size, index);
    if (pose.position[axis] !== layerCoordinate * normal[axis]) {
      stickers[index] = state.stickers[index];
     throw new Error('Не вдалося знайти клітинку після повороту.');
    stickers[target] = state.stickers[index];
  }
  return { size: state.size, stickers };
}

export function inversePuzzleMove(move: PuzzleMove): PuzzleMove {
  return { ...move, turns: move.turns === 2 ? 2 : -move.turns as 1 | -1 };
}

export function scrambleMoves(size: PuzzleSize, length = size === 2 ? 18 : size === 3 ? 25 : 40, rng: () => number = secureRandom): PuzzleMove[] {
  validateSize(size);
  if (!Number.isInteger(length) || length < 0) throw new RangeError('Довжина перемішування має бути невід’ємним цілим числом.');
  const result: PuzzleMove[] = [];
  while (result.length < length) {
    const face = faces[randomIndex(rng, faces.length)];
    if (result.at(-1)?.face === face) continue;
    result.push({ face, depth: size === 4 && randomIndex(rng, 2) === 1 ? 1 : 0, turns: ([1, -1, 2] as const)[randomIndex(rng, 3)] });
  }
  return result;
}

function randomIndex(rng: () => number, length: number): number {
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('Генератор випадкових чисел має повертати значення від 0 включно до 1 невключно.');
  return Math.floor(value * length);
}

function secureRandom(): number {
  const cryptoSource = globalThis.crypto;
  if (cryptoSource?.getRandomValues) {
    const value = new Uint32Array(1);
    cryptoSource.getRandomValues(value);
    return value[0] / 0x1_0000_0000;
  }
  return Math.random();
}

export function isPuzzleSolved(state: PuzzleState): boolean {
  if (![2, 3, 4].includes(state.size) || state.stickers.length !== state.size * state.size * 6) return false;
  const area = state.size * state.size;
  return faces.every((_, faceIndex) => {
    const first = state.stickers[faceIndex * area];
    return colorValues.includes(first) && state.stickers.slice(faceIndex * area, (faceIndex + 1) * area).every((color) => color === first);
  });
}

export function puzzleMoveLabel(move: PuzzleMove): string {
  const prefix = move.depth === 0 ? '' : `${move.depth + 1}`;
  const suffix = move.turns === -1 ? "'" : move.turns === 2 ? '2' : '';
  return `${prefix}${move.face}${suffix}`;
}

export function parsePuzzleKey(key: string, shift: boolean, alt: boolean, size: PuzzleSize): PuzzleMove | null {
  validateSize(size);
  const face = key.toUpperCase() as Face;
  if (!faces.includes(face)) return null;
  if (alt && size !== 4) return null;
  return { face, depth: alt ? 1 : 0, turns: shift ? -1 : 1 };
}

export function readPuzzle(raw: string | null, size: PuzzleSize): PuzzleState | null {
  validateSize(size);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const candidate = value as { size?: unknown; stickers?: unknown };
    if (candidate.size !== size || !Array.isArray(candidate.stickers) || candidate.stickers.length !== size * size * 6) return null;
    if (!candidate.stickers.every((color) => typeof color === 'string' && colorValues.includes(color as Color))) return null;
    const stickers = candidate.stickers as Color[];
    const area = size * size;
    if (colorValues.some((color) => stickers.filter((sticker) => sticker === color).length !== area)) return null;
    return { size, stickers: [...stickers] };
  } catch {
    return null;
  }
}
