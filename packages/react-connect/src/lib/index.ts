// https://react.dev/reference/react/useSyncExternalStore

import { useSyncExternalStore } from 'react';
import { createLens, Lens } from '@focus-js/core';
import { createStore, Logger } from '@focus-js/store';

const noop = () => {
  // noop
};

export const connect = <State>(initialState: State, logger: Logger = noop) => {
  const store = createStore(initialState, logger);

  const useFocusedState = <Focus = State>(lens: Lens<State, Focus>) => {
    const focusedStore = store.focus(lens);

    const { getState, updateState, select, subscribe } = focusedStore;

    const state = useSyncExternalStore(subscribe, getState);

    return [
      state, // reactive state
      updateState,
      select,
      getState, // synchronous state
    ] as const;
  };

  const NOOP_LENS = createLens<State, State>({
    get: (state) => state,
    set: (_, state) => state,
  });

  const useGlobalState = () => useFocusedState(NOOP_LENS);

  return { useGlobalState, useFocusedState };
};
