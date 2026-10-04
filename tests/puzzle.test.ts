import { describe, expect, it } from 'vitest';
import { applyMoves, faces, type Color, type Face } from '../src/cube';
import {
  applyPuzzleMove,
  faceNormal,
  getStickerIndexAtPose,
  inversePuzzleMove,
  isPuzzleSolved,
  parsePuzzleKey,
  puzzleMoveLabel,
  readPuzzle,
  scrambleMoves,
  solvedPuzzle,
  stickerPose,
  type PuzzleMove,
  type PuzzleState,
} from '../src/puzzle';

const faceColor: Record<Face, Color> = { U: 'white', R: 'red', F: 'green', D: 'yellow', L: 'orange', B: 'blue' };
const colorFace = Object.fromEntries(Object.entries(faceColor).map(([face, color]) => [color, face])) as Record<Color, Face>;

function apply(state: PuzzleState, moves: PuzzleMove[]): PuzzleState {
  return moves.reduce((current, move) => applyPuzzleMove(current, move), state);
}

function notation(move: PuzzleMove): string {
  return `${move.face}${move.turns === -1 ? "'" : move.turns === 2 ? '2' : ''}`;
}

function facelets(state: PuzzleState): string {
  return state.stickers.map((color) => colorFace[color]).join('');
}

describe('NxN puzzle state and moves', () => {
  it('matches cubejs URFDLB facelets for every 3x3 outer-face turn', () => {
    const solved = solvedPuzzle(3);
    const initial = facelets(solved);
    for (const face of faces) {
      for (const turns of [1, -1, 2] as const) {
        const move: PuzzleMove = { face, depth: 0, turns };
        const actual = facelets(applyPuzzleMove(solved, move));
        const expected = applyMoves(initial, `${notation(move)}`);
        expect(actual, notation(move)).toBe(expected);
      }
    }
  });

  it('preserves solved state after four turns and move followed by inverse on every size', () => {
    for (const size of [2, 3, 4] as const) {
      const solved = solvedPuzzle(size);
      for (const face of faces) {
        for (const depth of [0, ...(size === 4 ? [1] : [])]) {
          for (const turns of [1, -1, 2] as const) {
            const move: PuzzleMove = { face, depth, turns };
            expect(isPuzzleSolved(apply(solved, [move, move, move, move])), `${size} ${JSON.stringify(move)} four turns`).toBe(true);
            expect(apply(solved, [move, inversePuzzleMove(move)]), `${size} ${JSON.stringify(move)} inverse`).toEqual(solved);
          }
        }
      }
    }
  });

  it('rotates actual stickers on 4x4 inner slices and restores with inverse', () => {
    const solved = solvedPuzzle(4);
    const move: PuzzleMove = { face: 'R', depth: 1, turns: 1 };
    const turned = applyPuzzleMove(solved, move);
    expect(turned.stickers).not.toEqual(solved.stickers);
    expect(isPuzzleSolved(turned)).toBe(false);
    for (const color of Object.values(faceColor)) {
      expect(turned.stickers.filter((sticker) => sticker === color)).toHaveLength(16);
    }
    expect(applyPuzzleMove(turned, inversePuzzleMove(move))).toEqual(solved);
  });

  it('maps each URFDLB sticker pose back to its original index', () => {
    for (const size of [2, 3, 4] as const) {
      for (let index = 0; index < size * size * 6; index += 1) {
        const pose = stickerPose(size, index);
        expect(getStickerIndexAtPose(size, pose.position, pose.normal)).toBe(index);
      }
      for (const face of faces) {
        expect(faceNormal(face)).toHaveLength(3);
      }
    }
  });

  it('creates reproducible legal scrambles that reverse to solved', () => {
    for (const size of [2, 3, 4] as const) {
      let seed = 0x12345678;
      const rng = () => {
        seed = (1664525 * seed + 1013904223) >>> 0;
        return seed / 0x1_0000_0000;
      };
      const scramble = scrambleMoves(size, 30, rng);
      expect(scramble).toHaveLength(30);
      expect(scramble.every((move, index) => index === 0 || scramble[index - 1].face !== move.face)).toBe(true);
      expect(scramble.every((move) => move.depth === 0 || size === 4 && move.depth === 1)).toBe(true);
      const reversed = [...scramble].reverse().map(inversePuzzleMove);
      expect(isPuzzleSolved(apply(apply(solvedPuzzle(size), scramble), reversed))).toBe(true);
    }
  });

  it('labels, parses keyboard moves, and validates saved puzzle JSON', () => {
    expect(puzzleMoveLabel({ face: 'R', depth: 0, turns: 1 })).toBe('R');
    expect(puzzleMoveLabel({ face: 'R', depth: 1, turns: 1 })).toBe('2R');
    expect(puzzleMoveLabel({ face: 'U', depth: 0, turns: -1 })).toBe("U'");
    expect(parsePuzzleKey('f', true, false, 3)).toEqual({ face: 'F', depth: 0, turns: -1 });
    expect(parsePuzzleKey('R', false, true, 4)).toEqual({ face: 'R', depth: 1, turns: 1 });
    expect(parsePuzzleKey('R', false, true, 3)).toBeNull();
    expect(parsePuzzleKey('x', false, false, 4)).toBeNull();
    const state = solvedPuzzle(4);
    expect(readPuzzle(JSON.stringify(state), 4)).toEqual(state);
    expect(readPuzzle(JSON.stringify(state), 3)).toBeNull();
    expect(readPuzzle('{invalid', 4)).toBeNull();
    const wrongCounts = { ...state, stickers: [...state.stickers] };
    wrongCounts.stickers[0] = 'red';
    expect(readPuzzle(JSON.stringify(wrongCounts), 4)).toBeNull();
  });
});
