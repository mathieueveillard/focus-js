import { createLens } from '../..';

const lens = <T, K extends keyof T>(attribute: K) =>
  createLens<T, T[K]>({
    get: (t) => t[attribute],
    set: (t, value) => ({ ...t, [attribute]: value }),
  });

export default lens;
