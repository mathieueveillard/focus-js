import { createLens } from "../..";

const recordLens = <T>(id: string) =>
  createLens<Record<string, T>, T>({
    get: (state) => state[id],
    set: (state, t) => ({
      ...state,
      [id]: t,
    }),
  });

export default recordLens;
