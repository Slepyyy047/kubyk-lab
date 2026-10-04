import { applyMoves, validate, colors, type Color } from './cube';

export interface Solution { facelets: string; moves: string[]; centers: Color[] }
export interface SavedState { input: (Color|null)[]; solution: Solution|null; step: number; speed: number }
export const STORAGE_KEY = 'kubyk:v1';
export function readSaved(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SavedState;
    if (!Array.isArray(s.input) || s.input.length !== 54 || !s.input.every(c => c === null || Object.hasOwn(colors, c))) return null;
    let solution: Solution | null = null;
    const v = validate(s.input);
    if (v.ok && s.solution?.facelets === v.facelets && Array.isArray(s.solution.moves) && s.solution.moves.every(m => /^[URFDLB](2|')?$/.test(m))) {
      const final = applyMoves(v.facelets, s.solution.moves);
      if (['U','R','F','D','L','B'].every((f,i) => final.slice(i*9,i*9+9) === f.repeat(9))) {
        solution = { facelets:v.facelets, moves:s.solution.moves, centers:[4,13,22,31,40,49].map(i=>s.input[i] as Color) };
      }
    }
    return {input:s.input, solution, step:solution && Number.isInteger(s.step) ? Math.max(0,Math.min(s.step,solution.moves.length)) : 0, speed:[0.5,1,1.5,2].includes(s.speed) ? s.speed : 1};
  } catch { return null; }
}
