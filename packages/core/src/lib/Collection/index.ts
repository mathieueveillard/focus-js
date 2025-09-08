export type EffectCallback<T> = (t: T) => void;

export type Collection<T> = {
  get: () => T[];
  append: (t: T) => Collection<T>;
  remove: (t: T) => Collection<T>;
  forEach: (callback: EffectCallback<T>) => void;
};

export const createCollection = <T>(...values: T[]): Collection<T> => {
  const get = () => values;

  const append = (t: T) => createCollection(...values, t);

  const remove = (t: T) => {
    const index = values.findIndex((value) => value === t);
    const nextValues = [...values];
    nextValues.splice(index, 1);
    return createCollection(...nextValues);
  };

  const forEach = (callback: EffectCallback<T>) => {
    values.forEach((t) => {
      callback(t);
    });
  };

  return {
    get,
    append,
    remove,
    forEach,
  };
};
