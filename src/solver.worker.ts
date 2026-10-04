/// <reference lib="webworker" />
import Cube from 'cubejs';

type SolveRequest = { id: number; facelets: string };
type SolveResponse = { id: number; moves: string[]; error?: string };

let initialized = false;
const scope = self as DedicatedWorkerGlobalScope;

scope.onmessage = (event: MessageEvent<SolveRequest>) => {
  const { id, facelets } = event.data;
  try {
    if (!initialized) {
      Cube.initSolver();
      initialized = true;
    }
    const cube = Cube.fromString(facelets);
    const solution = cube.isSolved() ? '' : cube.solve();
    const response: SolveResponse = { id, moves: solution.trim() ? solution.trim().split(/\s+/) : [] };
    scope.postMessage(response);
  } catch {
    const response: SolveResponse = {
      id,
      moves: [],
      error: 'Не вдалося обчислити розв’язання. Перевірте стан кубика й повторіть пошук.',
    };
    scope.postMessage(response);
  }
};
