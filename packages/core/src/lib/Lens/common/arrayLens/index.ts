import { createLens } from '../..';

const lens = <T>(index: number) =>
  createLens<T[], T>({
    get: (state) => state[index],
    set: (state, t) => {
      const nextState = [...state];
      nextState[index] = t;
      return nextState;
    },
  });

export default lens;
