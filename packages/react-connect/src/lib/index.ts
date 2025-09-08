// https://react.dev/reference/react/useSyncExternalStore

import { useSyncExternalStore } from 'react';
import { Lens, noop } from '@focus/core';
import { createStore, Logger } from '@focus/store';

export const connect = <State>(initialState: State, logger: Logger = noop) => {
  const store = createStore(initialState, logger);

  const useGlobalState = () => {
    const { subscribe, getState, select, updateState } = store;

    const state = useSyncExternalStore(subscribe, getState);

    return {
      state,
      getSynchronousState: getState,
      select,
      updateState,
    };
  };

  const useFocusedState = <Focus = State>(lens: Lens<State, Focus>) => {
    const focusedStore = store.focus(lens);

    const { subscribe, getState, select, updateState } = focusedStore;

    const state = useSyncExternalStore(subscribe, getState);

    return {
      state,
      getSynchronousState: getState,
      select,
      updateState,
    };
  };

  return { useGlobalState, useFocusedState };
};
