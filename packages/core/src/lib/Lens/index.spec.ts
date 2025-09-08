import { createLens } from '.';

type A = number;

type B = {
  a: A;
  other: 'other';
};

type C = {
  b: B;
  other: 'other';
};

const a: A = 0;

const b: B = {
  a,
  other: 'other',
};

const c: C = {
  b,
  other: 'other',
};

describe('Test of createLens', () => {
  test('Simple lens', () => {
    // Given
    const lens = createLens<B, A>({
      get: ({ a }) => a,
      set: (b, a) => ({ ...b, a }),
    });

    // When
    const actual = lens.get(lens.set(b, 1));

    // Then
    const expected = 1;
    expect(actual).toEqual(expected);
  });

  test('Composition of a lens with a lens', () => {
    // Given
    const lens = createLens<C, B>({
      get: ({ b }) => b,
      set: (c, b) => ({ ...c, b }),
    });

    const strongerLens = createLens<B, A>({
      get: ({ a }) => a,
      set: (b, a) => ({ ...b, a }),
    });

    const composedLens = lens.focus(strongerLens);

    // When
    const actual = composedLens.get(composedLens.set(c, 1));

    // Then
    const expected = 1;
    expect(actual).toEqual(expected);
  });

  test('Composition of a lens with a reducer', () => {
    // Given
    const lens = createLens<B, A>({
      get: ({ a }) => a,
      set: (b, a) => ({ ...b, a }),
    });

    const reducer = lens.reduce((n) => n + 1);

    // When
    const actual = reducer(b);

    // Then
    const expected: B = {
      a: 1,
      other: 'other',
    };
    expect(actual).toEqual(expected);
  });
});
