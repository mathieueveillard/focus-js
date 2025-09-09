import { createLens } from '@focus-js/core';
import { createStore } from '.';

describe('Test of createStore', () => {
  describe('Without focusing', () => {
    type State = number;

    const initialState: State = 0;

    test('It should allow to update the state', () => {
      // Given
      const store = createStore<State>(initialState);

      // When
      store.updateState((state) => state + 1);
      const actual = store.getState();

      // Then
      const expected: State = 1;
      expect(actual).toEqual(expected);
    });

    test('It should allow to batch updates', () => {
      // Given
      const store = createStore<State>(initialState);

      // When
      store.updateState(
        (state) => state + 3,
        (state) => state * 2,
        (state) => state - 1
      );
      const actual = store.getState();

      // Then
      const expected: State = 5;
      expect(actual).toEqual(expected);
    });

    test('It should notify its subscribers', () => {
      // Given
      const store = createStore<State>(initialState);
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      // When
      store.updateState((state) => state + 1);

      // Then
      expect(subscriber).toHaveBeenCalled();
    });

    test('It should allow its subscribers to unsubscribe', () => {
      // Given
      const store = createStore<State>(initialState);
      const subscriber = vi.fn();
      const cleanUp = store.subscribe(subscriber);
      cleanUp();

      // When
      store.updateState((state) => state + 1);

      // Then
      expect(subscriber).not.toHaveBeenCalled();
    });

    test('It should allow many subscribers to subscribe and unsubscribe', () => {
      // Given
      const store = createStore<State>(initialState);
      const first = vi.fn();
      const cleanUp = store.subscribe(first);
      const second = vi.fn();
      store.subscribe(second);
      cleanUp();

      // When
      store.updateState((state) => state + 1);

      // Then
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalled();
    });

    test('It should allow to derivate the state', () => {
      // Given
      const store = createStore<State>(initialState);

      // When
      const actual = store.select((state) => state + 1);

      // Then
      const expected = 1;
      expect(actual).toEqual(expected);
    });
  });

  describe('With focusing', () => {
    type State = {
      count: number;
      other: 'other';
    };

    const initialState: State = {
      count: 0,
      other: 'other',
    };

    const lens = createLens<State, number>({
      get: ({ count }) => count,
      set: (state, count) => ({ ...state, count }),
    });

    test('It should allow to update the state', () => {
      // Given
      const store = createStore<State>(initialState);
      const focusedStore = store.focus(lens);

      // When
      focusedStore.updateState((count) => count + 1);
      const actual = store.getState();

      // Then
      const expected: State = {
        count: 1,
        other: 'other',
      };
      expect(actual).toEqual(expected);
    });

    test('It should allow to batch updates', () => {
      // Given
      const store = createStore<State>(initialState);
      const focusedStore = store.focus(lens);

      // When
      focusedStore.updateState(
        (state) => state + 3,
        (state) => state * 2,
        (state) => state - 1
      );
      const actual = store.getState();

      // Then
      const expected: State = {
        count: 5,
        other: 'other',
      };
      expect(actual).toEqual(expected);
    });

    test('It should notify its subscribers', () => {
      // Given
      const store = createStore<State>(initialState).focus(lens);
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      // When
      store.updateState((count) => count + 1);

      // Then
      expect(subscriber).toHaveBeenCalled();
    });

    test('It should notify its subscribers (bis)', () => {
      // Given
      const store = createStore<State>(initialState);
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      const focusedStore = store.focus(lens);

      // When
      focusedStore.updateState((count) => count + 1);

      // Then
      expect(subscriber).toHaveBeenCalled();
    });

    test('It should allow to derivate the state', () => {
      // Given
      const store = createStore<State>(initialState).focus(lens);

      // When
      const actual = store.select((state) => state + 1);

      // Then
      const expected = 1;
      expect(actual).toEqual(expected);
    });
  });
});
