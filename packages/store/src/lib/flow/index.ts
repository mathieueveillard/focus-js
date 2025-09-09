import { Reducer } from '@focus-js/core';

export const flow =
  <State>(...fns: Reducer<State>[]): Reducer<State> =>
  (state) =>
    fns.reduce((accumulator, fn) => fn(accumulator), state);
