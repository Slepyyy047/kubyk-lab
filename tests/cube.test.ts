import { den', 'yellow', 'orange', 'blue'];

function validFacelets(): string {
  const result = validate(solvedColors());
  if (!result.ok) throw new Error(result.error);
  return result.facelets;
}

function colorsFor(facelets: string): Color[] {
  return faceletsToColors(facelets, centers);
}

describe('cube state validation and solving', () => {
  it('validates the solved cube and returns no moves', () => {
    const result = validate(solvedColors());
    expect(result.ok).toBe(true);
    if (result.ok) expect(solveFacelets(result.facelets)).toEqual([]);
  });

  it('reports empty cells and wrong color counts in Ukrainian', () => {
    expect(validate(Array<Color | null>(54).fill(null))).toMatchObject({ ok: false, error: expect.stringContaining(ls still match', () => {
    const repeatedCenters = solvedColors();
    repeatedCenters[13] = 'white';
    repeatedCenters[0] = 'red';
    expect(validate(repeatedCenters)).toMatchObject({ ok: false, error: expect.stringContaining('Центри шести граней') });
  });

  it('solves several legal scrambled states back to solved', () => {
    const scrambles = [
      "R U R' U' F2 D L2 B U2",
      "F R U' R' U' R U R' F'",
      "D2 L' U2 B R2 F' D L U'",
      "B2 U R2 D' F L2 U2 R' B",
  flipped = [...validFacelets()];
    [flipped[5], flipped[10]] = [flipped[10], flipped[5]];
    expect(validate(colorsFor(flipped.join('')))).toMatchObject({ ok: false, error: expect.stringMatching(/перевернуто/i) });
  });

  it('solves reproducible l  const scramble=Array.from({length:30},()=>{let f=next()%6;while(f===last)f=next()%6;last=f;return moves[f]+['',"'",'2'][next()%3];}).join(' ');
      const state=applyMoves(validFacelets(),scramble);
      expect(validate(colorsFor(state)).ok).toBe(t two edges', () => {
    const cornerSwap = [...validFacelets()];
    for (const [a, b] of [[8, 6], [9, 18], [20, 38]]) [cornerSwap[a], cornerSwap[b]] = [cornerSwap[b], cornerSwap[a]];
    expect(validate(colorsFor(cornerSwap.join('')))).toMatchObject({ ok: false, error: expect.stringContaining('парність') });

    const edgeSwap = [...validFacelets()];
    for (const [a, b] of [[5, 7], [10, 19]]) [edgeSwap[a], edgeSwap[b]] = [edgeSwap[b], edgeSwap[a]];
    expect(validate(colorsFor(edgeSwap.join('')))).toMatchObject({ ok: false, error: expect.stringContaining('парність') });
  });

  it('rejects a mirrored corner with a specific explanation', () => {
    const mirrored = [...validFacelets()];
    [mirrored[9], mirrored[20]] = [mirrored[20], mirrored[9]];
    expect(validate(colorsFor(mirrored.join('')))).toMatchObject({ ok: false, error: expect.stringContaining('дзеркально') });
  });

  it('creates an example by applying a real scramble and inverts algorithms', () => {
    const example = validate(exampleColors());
    expect(example.ok).toBe(true);
    expect(invertAlgorithm("R U R' U'")).toBe("U R U' R'");
  });
});
