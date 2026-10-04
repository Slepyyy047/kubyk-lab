import { describe, expect, it } from 'vitesface poses', () => {
    const poses = Array.from({ length: 54 }, (_, i) => {
      const { position, normal } = faceletGeometry(i);
      return `${position.join(',')}|${normal.join(',')}`;
    });
    expect(new Set(poses).size).toBe(54);
    expect(poses).toHaveLength(54);
  });

  it('matches cubejs clockwise and inverse face turns for each face', () => {
    const start = solvedColors().map((_, index) => faces[Math.floor(index / 9)]).join('');
    const mixed = applyMoves(start, "R U F' L2 D B' U2 R' F D2");
    for (const face of faces) {
      const clockwise = permuteFacelets([...mixed], turnFaceletPermutation(face));
      expect(clockwise.join('')).toBe(applyMoves(mixed, face));
      const inverse = permuteFacelets([...mixed], turnFaceletPermutation(face, -1));
      expect(inverse.join('')).toBe(applyMoves(mixed, `${face}'`));
      const half = permuteFacelets(clockwise, turnFaceletPermutation(face));
      expect(half.join('')).toBe(applyMoves(mixed, `${face}2`));
    }
  });
});
