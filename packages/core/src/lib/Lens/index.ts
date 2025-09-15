import { Reducer } from '../Reducer';

type Getter<Outer, Inner> = (outer: Outer) => Inner;

type Setter<Outer, Inner> = (outer: Outer, inner: Inner) => Outer;

export type Lens<Outer, Inner> = {
  get: Getter<Outer, Inner>;
  set: Setter<Outer, Inner>;
  focus: <I>(lens: Lens<Inner, I>) => Lens<Outer, I>;
  reduce: (reducer: Reducer<Inner>) => Reducer<Outer>;
};

type Parameters<Outer, Inner> = {
  get: Getter<Outer, Inner>;
  set: Setter<Outer, Inner>;
};

export const createLens = <Outer, Inner>({
  get,
  set,
}: Parameters<Outer, Inner>): Lens<Outer, Inner> => {
  // Composition of a lens with another lens
  const focus = <I>(lens: Lens<Inner, I>): Lens<Outer, I> =>
    createLens({
      get: (outer) => lens.get(get(outer)),
      set: (outer, i) => set(outer, lens.set(get(outer), i)),
    });

  // Composition of a lens with a reducer
  const reduce =
    (reducer: Reducer<Inner>): Reducer<Outer> =>
    (outer: Outer) =>
      set(outer, reducer(get(outer)));

  return {
    get,
    set,
    focus,
    reduce,
  };
};
