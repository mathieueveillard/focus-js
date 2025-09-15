import { createLens } from '../..';

const attributeLens = <State, Key extends keyof State>(key: Key) =>
  createLens<State, State[Key]>({
    get: (state) => state[key],
    set: (state, value) => ({ ...state, [key]: value }),
  });

export default attributeLens;
