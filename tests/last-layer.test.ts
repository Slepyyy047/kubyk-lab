import { describe, expect, it } from 'vitest';
import Cube from 'cubejs';

const ua = "F2 U L R' F2 L' R U F2";

function* permutations(values: number[], start = 0): Generator<number[]> {
  if (start === values.length) {
    yield [...values];
    return;
  }
  for (let index = start; index < values.length; index += 1) {
    [values[start], values[index]] = [values[index], values[start]];
    yield* permutations(values, start + 1);
    [values[start], values[index]] = [values[index], values[start]];
  }
}

function oddPermutation(values: number[]): boolean {
  let inversions = 0;
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      if (values[i] > values[j]) inversions += 1;
    }
  }
  return inversions % 2 === 1;
}

function upperEdges(cube: Cube): number[] {
  return cube.toJSON().ep.slice(0, 4);
}

function upperCorners(cube: Cube): number[] {
  return cube.toJSON().cp.slice(0, 4);
}

function permutationParity(values: number[]): number {
  return oddPermutation(values) ? 1 : 0;
}

function alignForUa(cube: Cube): { fixed: number[]; solved: boolean } | undefined {
  for (let turn = 0; turn < 4; turn += 1) {
    const edges = upperEdges(cube);
    const fixed = edges.map((piece, position) => piece === position ? position : -1).filter((position) => position >= 0);
    if (fixed.length === 4) return { fixed, solved: true };
    if (fixed.length === 1) return { fixed, solved: false };
    cube.move('U');
  }
  return undefined;
}

function uaForFixedEdge(position: number): string {
  // Conjugates of Ua around U keep the selected upper edge fixed while
  // cycling the other three.  The whole-cube yaw is thereby explicit here.
  const turns = position === 3 ? '' : position === 2 ? 'U' : position === 1 ? 'U2' : "U'";
  const inverse = position === 3 ? '' : position === 2 ? "U'" : position === 1 ? 'U2' : 'U';
  return [turns, ua, inverse].filter(Boolean).join(' ');
}

function prepareLegalCube(topEdgePermutation: number[]): Cube {
  const ep = [...topEdgePermutation, 4, 5, 6, 7, 8, 9, 10, 11];
  const cp = Array.from({ length: 8 }, (_, index) => index);
  if (oddPermutation(ep)) [cp[0], cp[1]] = [cp[1], cp[0]];
  return new Cube({
    center: [0, 1, 2, 3, 4, 5],
    cp,
    co: Array(8).fill(0),
    ep,
    eo: Array(12).fill(0),
  });
}

describe('beginner Ua edge-permutation procedure', () => {
  it('aligns and solves the upper edges for all 24 legal permutations', () => {
    let fallbackCases = 0;
    for (const permutation of permutations([0, 1, 2, 3])) {
      const cube = prepareLegalCube(permutation);
      let alignment = alignForUa(cube);
      if (!alignment) {
        fallbackCases += 1;
        cube.move(ua);
        alignment = alignForUa(cube);
      }

      expect(alignment, `edge permutation ${permutation.join('')}`).toBeDefined();
      if (!alignment) continue;
      if (!alignment.solved) {
        const operation = uaForFixedEdge(alignment.fixed[0]);
        cube.move(operation);
        if (upperEdges(cube).some((piece, position) => piece !== position)) cube.move(operation);
      }

      expect(upperEdges(cube), `edge permutation ${permutation.join('')}`).toEqual([0, 1, 2, 3]);
      expect(permutationParity(upperCorners(cube)) % 2).toBe(0);
    }
    expect(fallbackCases).toBeGreaterThan(0);
  });
});

describe('beginner last-layer corner-orientation procedure', () => {
  it('orients all 27 legal top-corner twist combinations and restores the cube', () => {
    const twist = "R' D' R D";
    for (let first = 0; first < 3; first += 1) {
      for (let second = 0; second < 3; second += 1) {
        for (let third = 0; third < 3; third += 1) {
          const fourth = (3 - (first + second + third) % 3) % 3;
          const cube = new Cube({
            center: [0, 1, 2, 3, 4, 5],
            cp: Array.from({ length: 8 }, (_, index) => index),
            co: [first, second, third, fourth, 0, 0, 0, 0],
            ep: Array.from({ length: 12 }, (_, index) => index),
            eo: Array(12).fill(0),
          });

          for (let corner = 0; corner < 4; corner += 1) {
            let repetitions = 0;
            while (cube.asString()[8] !== 'U' && repetitions < 6) {
              cube.move(twist);
              repetitions += 1;
            }
            expect(cube.asString()[8], `top-corner twists ${first}${second}${third}${fourth}, slot ${corner}`).toBe('U');
            cube.move('U');
          }

          expect(cube.isSolved(), `top-corner twists ${first}${second}${third}${fourth}`).toBe(true);
        }
      }
    }
  });
});
