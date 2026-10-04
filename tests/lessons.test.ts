import { describe, expect, it } from 'vitest';
import { applyMoves, faceletsToColors, validate } from '../src/cube';
import { invertAlgorithm, lessons } from '../src/lessons';

const solved = 'U'.repeat(9) + 'R'.repeat(9) + 'F'.repeat(9) + 'D'.repeat(9) + 'L'.repeat(9) + 'B'.repeat(9);
const firstLayerIndexes = [27, 28, 29, 30, 31, 32, 33, 34, 35, 15, 16, 17, 24, 25, 26, 42, 43, 44, 51, 52, 53];
const firstTwoLayerIndexes = [
  ...Array.from({ length: 9 }, (_, index) => 27 + index),
  ...Array.from({ length: 6 }, (_, index) => 12 + index),
  ...Array.from({ length: 6 }, (_, index) => 21 + index),
  ...Array.from({ length: 6 }, (_, index) => 39 + index),
  ...Array.from({ length: 6 }, (_, index) => 48 + index)
];
const cornerFacelets = [
  [8, 9, 20], [6, 18, 38], [0, 36, 47], [2, 45, 11],
  [29, 26, 15], [27, 44, 24], [33, 53, 42], [35, 17, 51]
];
const isFirstLayerSolved = (state: string) => firstLayerIndexes.every((index) => state[index] === solved[index]);
const isFirstTwoLayersSolved = (state: string) => firstTwoLayerIndexes.every((index) => state[index] === solved[index]);
const hasYellowCross = (state: string) => [1, 3, 5, 7].every((index) => state[index] === 'U');
const hasYellowFace = (state: string) => state.slice(0, 9) === 'U'.repeat(9);
const hasCornersPositioned = (state: string) => cornerFacelets.every((indexes) =>
  indexes.map((index) => state[index]).sort().join('') === indexes.map((index) => solved[index]).sort().join('')
);

describe('beginner lessons', () => {
  it('contains all six requested beginner stages in order', () => {
    expect(lessons.map(({ id }) => id)).toEqual([
      'notation', 'white-cross', 'first-layer', 'middle-layer', 'yellow-cross', 'last-layer'
    ]);
  });

  it('provides complete Ukrainian lesson content and a reproducible algorithm demo', () => {
    for (const lesson of lessons) {
      expect(lesson.title).toBeTruthy();
      expect(lesson.goal).toBeTruthy();
      expect(lesson.explanation.length).toBeGreaterThan(0);
      expect(lesson.orientation).toBeTruthy();
      expect(lesson.conditions).toBeTruthy();
      expect(lesson.mistakes.length).toBeGreaterThan(0);
      expect(lesson.result).toBeTruthy();
      expect(lesson.base).toHaveLength(54);
      expect(lesson.centers).toHaveLength(6);

      const demoStart = applyMoves(lesson.base, lesson.setup);
      expect(demoStart).not.toBe(lesson.base);
      expect(applyMoves(demoStart, lesson.algorithm)).toBe(lesson.base);
      expect(validate(faceletsToColors(demoStart, lesson.centers))).toEqual({ ok: true, facelets: demoStart });

      for (const demo of lesson.demos ?? []) {
        const demoSetup = applyMoves(lesson.base, demo.setup);
        expect(applyMoves(demoSetup, demo.algorithm)).toBe(lesson.base);
        expect(validate(faceletsToColors(demoSetup, lesson.centers))).toEqual({ ok: true, facelets: demoSetup });
      }
    }
  });

  it('starts each stage demonstration with the progress its instructions require', () => {
    const stage = (id: string) => lessons.find((lesson) => lesson.id === id)!;
    const crossStart = applyMoves(stage('white-cross').base, stage('white-cross').setup);
    expect([30, 32, 34].every((index) => crossStart[index] === 'D')).toBe(true);
    expect(crossStart[7]).toBe('D');
    expect(crossStart[19]).toBe('F');

    const firstStart = applyMoves(stage('first-layer').base, stage('first-layer').setup);
    expect([28, 30, 32, 34].every((index) => firstStart[index] === 'D')).toBe(true);
    expect(isFirstLayerSolved(firstStart)).toBe(false);
    expect([8, 9, 20].map((index) => firstStart[index]).sort().join('')).toBe('DFR');

    const middleStart = applyMoves(stage('middle-layer').base, stage('middle-layer').setup);
    expect(isFirstLayerSolved(middleStart)).toBe(true);
    const leftDemo = stage('middle-layer').demos!.find(({ id }) => id === 'left-insertion')!;
    const leftStart = applyMoves(stage('middle-layer').base, leftDemo.setup);
    expect(isFirstLayerSolved(leftStart)).toBe(true);
    expect(applyMoves(leftStart, leftDemo.algorithm)).toBe(stage('middle-layer').base);

    const yellowStart = applyMoves(stage('yellow-cross').base, stage('yellow-cross').setup);
    expect(isFirstTwoLayersSolved(yellowStart)).toBe(true);
    expect([3, 5].every((index) => yellowStart[index] === 'U')).toBe(true);

    const final = stage('last-layer');
    const edgeStart = applyMoves(final.base, final.setup);
    expect(isFirstTwoLayersSolved(edgeStart)).toBe(true);
    expect(hasYellowFace(edgeStart)).toBe(true);
    expect(edgeStart.slice(45, 54)).toBe('B'.repeat(9));

    const cornerPositionDemo = final.demos!.find(({ id }) => id === 'corner-position')!;
    const cornerPositionStart = applyMoves(final.base, cornerPositionDemo.setup);
    expect(isFirstTwoLayersSolved(cornerPositionStart)).toBe(true);
    expect(hasYellowCross(cornerPositionStart)).toBe(true);
    expect(cornerFacelets[0].map((index) => cornerPositionStart[index]).sort().join('')).toBe('FRU');

    const cornerOrientationDemo = final.demos!.find(({ id }) => id === 'corner-orientation')!;
    const cornerOrientationStart = applyMoves(final.base, cornerOrientationDemo.setup);
    expect(isFirstTwoLayersSolved(cornerOrientationStart)).toBe(true);
    expect(hasYellowCross(cornerOrientationStart)).toBe(true);
    expect(hasCornersPositioned(cornerOrientationStart)).toBe(true);
    expect([0, 2, 6, 8].filter((index) => cornerOrientationStart[index] === 'U')).toHaveLength(2);
  });

  it('generates inverse setups for quarter turns and half turns', () => {
    expect(invertAlgorithm("R U R' U2")).toBe("U2 R U' R'");
  });

  it('keeps white-down teaching orientation consistent with a real whole-cube rotation', () => {
    expect(lessons.find(({ id }) => id === 'notation')!.centers).toEqual([
      'white', 'red', 'green', 'yellow', 'orange', 'blue'
    ]);
    for (const lesson of lessons.filter(({ id }) => id !== 'notation')) {
      expect(lesson.centers).toEqual(['yellow', 'orange', 'green', 'white', 'red', 'blue']);
    }
  });
});
