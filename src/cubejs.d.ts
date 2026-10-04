declare module 'cubejs' {
  class Cube {
    constructor(state?: unknown);
    static fromString(facelets: string): Cube;
    static initSolver(): void;
    static inverse(algorithm: string | number | number[]): string | number | number[];
    move(algorithm: string | number | number[]): this;
    asString(): string;
    toJSON(): { center: number[]; cp: number[]; co: number[]; ep: number[]; eo: number[] };
    isSolved(): boolean;
    solve(maxDepth?: number): string;
  }
  export default Cube;
}
