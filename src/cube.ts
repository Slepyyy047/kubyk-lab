import Cube from 'cubejs';

export const faces = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
export type Face = (typeof faces)[number];
export type Color = 'white' | 'red' | 'green' | 'yellow' | 'orange' | 'blue';

export const colors: Record<Color, { hex: string; label: string }> = {
  white: { hex: '#f8fafc', label: 'Білий' },
  red: { hex: '#ef4444', label: 'Червоний' },
  green: { hex: '#22a06b', label: 'Зелений' },
  yellow: { hex: '#facc15', label: 'Жовтий' },
  orange: { hex: '#f97316', label: 'Помаранчевий' },
  blue: { hex: '#3b82f6', label: 'Синій' },
};

const colorOrder: Color[] = ['white', 'red', 'green', 'yellow', 'orange', 'blue'];
const faceletCount = 54;

export function solvedColors(): Color[] {
  return faces.flatMap((_, faceIndex) => Array<Color>(9).fill(colorOrder[faceIndex]));
}

export function exampleColors(): Color[] {
  const result = solvedColors();
  const scramble = "R U R' U' F2 D L2 B U2";
  const cube = Cube.fromString(colorsToFacelets(result));
  cube.move(scramble);
  return faceletsToColors(cube.asString(), colorOrder);
}

function colorsToFacelets(input: Color[]): string {
  const map = new Map<Color, Face>(colorOrder.map((color, index) => [color, faces[index]]));
  return input.map((color) => map.get(color) ?? '?').join('');
}

function permutationParity(permutation: number[]): number {
  let inversions = 0;
  for (let i = 0; i < permutation.length; i += 1) {
    for (let j = i + 1; j < permutation.length; j += 1) {
      if (permutation[i] > permutation[j]) inversions += 1;
    }
  }
  return inversions % 2;
}

// Facelet indexes follow cubejs/Kociemba URFDLB ordering.
const edgeFacelets = [
  [5, 10], [7, 19], [3, 37], [1, 46], [32, 16], [28, 25],
  [30, 43], [34, 52], [23, 12], [21, 41], [50, 39], [48, 14],
];
const edgeColors = [
  ['U', 'R'], ['U', 'F'], ['U', 'L'], ['U', 'B'], ['D', 'R'], ['D', 'F'],
  ['D', 'L'], ['D', 'B'], ['F', 'R'], ['F', 'L'], ['B', 'L'], ['B', 'R'],
];
const cornerFacelets = [
  [8, 9, 20], [6, 18, 38], [0, 36, 47], [2, 45, 11],
  [29, 26, 15], [27, 44, 24], [33, 53, 42], [35, 17, 51],
];
const cornerColors = [
  ['U', 'R', 'F'], ['U', 'F', 'L'], ['U', 'L', 'B'], ['U', 'B', 'R'],
  ['D', 'F', 'R'], ['D', 'L', 'F'], ['D', 'B', 'L'], ['D', 'R', 'B'],
];

function validateCubies(facelets: string): string | undefined {
  const edgePermutation: number[] = [];
  const edgeOrientation: number[] = [];
  for (const [first, second] of edgeFacelets) {
    const a = facelets[first];
    const b = facelets[second];
    let piece = -1;
    let orientation = -1;
    for (let i = 0; i < edgeColors.length; i += 1) {
      if (a === edgeColors[i][0] && b === edgeColors[i][1]) {
        piece = i;
        orientation = 0;
        break;
      }
      if (a === edgeColors[i][1] && b === edgeColors[i][0]) {
        piece = i;
        orientation = 1;
        break;
      }
    }
    if (piece < 0) return 'Є ребро з неможливим поєднанням кольорів.';
    if (edgePermutation.includes(piece)) return 'Одне й те саме ребро введено двічі.';
    edgePermutation.push(piece);
    edgeOrientation.push(orientation);
  }
  if (edgeOrientation.reduce((sum, value) => sum + value, 0) % 2 !== 0) {
    return 'Перевернуто одне ребро або введено непарну кількість перевернутих ребер.';
  }

  const cornerPermutation: number[] = [];
  const cornerOrientation: number[] = [];
  for (const positions of cornerFacelets) {
    const stickers = positions.map((position) => facelets[position]);
    const orientation = stickers.findIndex((sticker) => sticker === 'U' || sticker === 'D');
    if (orientation < 0) return 'Кут не містить кольору верхньої або нижньої грані.';
    const first = stickers[orientation];
    const second = stickers[(orientation + 1) % 3];
    const third = stickers[(orientation + 2) % 3];
    const piece = cornerColors.findIndex((colors) => colors[0] === first && colors[1] === second && colors[2] === third);
    if (piece < 0) {
      const samePieces = cornerColors.some((colors) => colors.every((color) => stickers.includes(color)));
      return samePieces
        ? 'Кут має дзеркально переставлені кольори: така орієнтація фізично неможлива.'
        : 'Є кут з неможливим поєднанням кольорів.';
    }
    if (cornerPermutation.includes(piece)) return 'Один і той самий кут введено двічі.';
    cornerPermutation.push(piece);
    cornerOrientation.push(orientation % 3);
  }
  if (cornerOrientation.reduce((sum, value) => sum + value, 0) % 3 !== 0) {
    return 'Повернуто один кут або сума поворотів кутів не кратна трьом.';
  }
  if (permutationParity(edgePermutation) !== permutationParity(cornerPermutation)) {
    return 'Перестановки кутів і ребер мають різну парність; стан кубика неможливий.';
  }
  return undefined;
}

export function validate(input: (Color | null)[]): { ok: true; facelets: string } | { ok: false; error: string } {
  if (input.length !== faceletCount) return { ok: false, error: 'Потрібно заповнити рівно 54 клітинки.' };
  const missing = input.findIndex((color) => color === null);
  if (missing !== -1) {
    const faceNames = ['верхньої U', 'правої R', 'передньої F', 'нижньої D', 'лівої L', 'задньої B'];
    return { ok: false, error: `Заповніть клітинку ${missing % 9 + 1} ${faceNames[Math.floor(missing / 9)]} грані; зараз вона порожня.` };
  }
  const complete = input as Color[];
  for (const color of colorOrder) {
    const count = complete.filter((value) => value === color).length;
    if (count !== 9) return { ok: false, error: `Кольору «${colors[color].label.toLowerCase()}» має бути рівно 9, зараз — ${count}.` };
  }

  const centers = faces.map((_, index) => complete[index * 9 + 4]);
  if (new Set(centers).size !== faces.length) {
    return { ok: false, error: 'Центри шести граней мають бути різних кольорів.' };
  }
  const centerToFace = new Map<Color, Face>(centers.map((color, index) => [color!, faces[index]]));
  const facelets = complete.map((color) => centerToFace.get(color!) ?? '?').join('');
  const cubieError = validateCubies(facelets);
  if (cubieError) return { ok: false, error: cubieError };
  return { ok: true, facelets };
}

export function applyMoves(facelets: string, moves: string | string[]): string {
  const cube = Cube.fromString(facelets);
  cube.move(Array.isArray(moves) ? moves.join(' ') : moves);
  return cube.asString();
}

export function invertAlgorithm(algorithm: string): string {
  const trimmed = algorithm.trim();
  return trimmed ? Cube.inverse(trimmed) as string : '';
}

export function faceletsToColors(facelets: string, centers: Color[]): Color[] {
  if (facelets.length !== faceletCount || centers.length !== 6) throw new Error('Очікується 54 наліпки та 6 кольорів центрів.');
  const toColor = new Map<Face, Color>(faces.map((face, index) => [face, centers[index]]));
  return [...facelets].map((letter) => {
    const color = toColor.get(letter as Face);
    if (!color) throw new Error(`Невідома позначка грані: ${letter}`);
    return color;
  });
}

export function describeMove(move: string): string {
  const match = move.match(/^([URFDLB])([2']?)$/);
  if (!match) return `Невідомий рух «${move}».`;
  const names: Record<string, string> = { U: 'верхню', D: 'нижню', L: 'ліву', R: 'праву', F: 'передню', B: 'задню' };
  const turn = match[2] === '2' ? 'на пів оберту (180°)' : match[2] === "'" ? 'на чверть оберту проти годинникової стрілки (якщо дивитися прямо на цю грань)' : 'на чверть оберту за годинниковою стрілкою (якщо дивитися прямо на цю грань)';
  return `Поверніть ${names[match[1]]} грань ${turn}.`;
}

let solverInitialized = false;

export function solveFacelets(facelets: string): string[] {
  if (!solverInitialized) {
    Cube.initSolver();
    solverInitialized = true;
  }
  const cube = Cube.fromString(facelets);
  if (cube.isSolved()) return [];
  const solution = cube.solve();
  return solution.trim() ? solution.trim().split(/\s+/) : [];
}
