import { createLens } from "../..";

const lens = <T>(id: string) =>
  createLens<Record<string, T>, T>({
    get: (state) => state[id],
    set: (state, t) => ({
      ...state,
      [id]: t,
    }),
  });

export default lens;
