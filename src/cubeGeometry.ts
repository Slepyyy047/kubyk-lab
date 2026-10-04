import type { Face } from './cube';

export type Vec3 = readonly [number, number, number];
export interface FaceletGeometry { position: Vec3; normal: Vec3 }

const faceOrder: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
const key = (position: Vec3, normal: Vec3) => `${position.join(',')}|${normal.join(',')}`;

/** Convert a cubejs URFDLB facelet index to its sticker centre and outward normal. */
export function faceletGeometry(index: number): FaceletGeometry {
  if (!Number.isInteger(index) || index < 0 || index >= 54) throw new RangeError('Facelet index must be between 0 and 53.');
  const face = faceOrder[Math.floor(index / 9)];
  const row = Math.floor((index % 9) / 3);
  const column = index % 3;
  switch (face) {
    // U is read with B at the top; D is read with F at the top.
    case 'U': return { position: [column - 1, 1, row - 1], normal: [0, 1, 0] };
    case 'R': return { position: [1, 1 - row, 1 - column], normal: [1, 0, 0] };
    case 'F': return { position: [column - 1, 1 - row, 1], normal: [0, 0, 1] };
    case 'D': return { position: [column - 1, -1, 1 - row], normal: [0, -1, 0] };
    case 'L': return { position: [-1, 1 - row, column - 1], normal: [-1, 0, 0] };
    case 'B': return { position: [1 - column, 1 - row, -1], normal: [0, 0, -1] };
  }
}

export function faceletIndexAtPose(position: Vec3, normal: Vec3): number | undefined {
  return faceletByPose.get(key(position, normal));
}

const faceletByPose = new Map<string, number>();
for (let i = 0; i < 54; i += 1) {
  const pose = faceletGeometry(i);
  faceletByPose.set(key(pose.position, pose.normal), i);
}

/** Return old-index -> new-index for a clockwise face turn (or its inverse). */
export function turnFaceletPermutation(face: Face, amount: 1 | -1 = 1): number[] {
  const normal = faceletGeometry(faceOrder.indexOf(face) * 9 + 4).normal;
  const axis = normal.findIndex((component) => component !== 0);
  const outwardSign = normal[axis];
  // Right-hand positive rotations look counter-clockwise from outside.
  const quarterTurns = -amount * outwardSign;
  return Array.from({ length: 54 }, (_, index) => {
    const { position, normal: stickerNormal } = faceletGeometry(index);
    if (position[axis] !== outwardSign) return index;
    const rotate = (v: Vec3): Vec3 => {
      const [x, y, z] = v;
      if (axis === 0) return quarterTurns > 0 ? [x, -z, y] : [x, z, -y];
      if (axis === 1) return quarterTurns > 0 ? [z, y, -x] : [-z, y, x];
      return quarterTurns > 0 ? [-y, x, z] : [y, -x, z];
    };
    const target = faceletByPose.get(key(rotate(position), rotate(stickerNormal)));
    if (target === undefined) throw new Error(`Unable to map rotated facelet ${index}.`);
    return target;
  });
}

export function permuteFacelets<T>(facelets: readonly T[], permutation: readonly number[]): T[] {
  if (facelets.length !== 54 || permutation.length !== 54) throw new RangeError('Expected 54 facelets and a 54-entry permutation.');
  const result = Array<T>(54);
  permutation.forEach((target, source) => { result[target] = facelets[source]; });
  return result;
}
