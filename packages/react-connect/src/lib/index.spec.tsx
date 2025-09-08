// https://testing-library.com/docs/queries/about

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { connect } from '.';
import { createLens } from '@focus/core';

describe('Without focusing', () => {
  type State = number;

  test('It should allow to read the state', async () => {
    // Given
    const { useGlobalState: useState } = connect<State>(0);

    const Component: React.FunctionComponent = () => {
      const { state, updateState } = useState();

      const onClick = (): void => {
        updateState((state) => state + 1);
      };

      return (
        <div>
          <button data-testid="update" onClick={onClick}>
            Update
          </button>
          <div data-testid="state">{state}</div>
        </div>
      );
    };

    render(<Component />);

    // When
    // Then
    expect(screen.getByTestId('state')).toHaveTextContent('0');
  });

  test('It should allow to update the state', async () => {
    // Given
    const { useGlobalState: useState } = connect<State>(0);

    const Component: React.FunctionComponent = () => {
      const { state, updateState } = useState();

      const onClick = (): void => {
        updateState((state) => state + 1);
      };

      return (
        <div>
          <button data-testid="update" onClick={onClick}>
            Update
          </button>
          <div data-testid="state">{state}</div>
        </div>
      );
    };

    render(<Component />);

    // When
    await userEvent.click(screen.getByTestId('update'));

    // Then
    expect(screen.getByTestId('state')).toHaveTextContent('1');
  });
});

describe('With focusing', () => {
  type State = {
    value: number;
    other: 'other';
  };

  const lens = createLens<State, number>({
    get: ({ value }) => value,
    set: (state, value) => ({ ...state, value }),
  });

  test('It should allow to read the state', async () => {
    // Given
    const { useFocusedState: useState } = connect<State>({
      value: 0,
      other: 'other',
    });

    const Component: React.FunctionComponent = () => {
      const { state, updateState } = useState(lens);

      const onClick = (): void => {
        updateState((state) => state + 1);
      };

      return (
        <div>
          <button data-testid="update" onClick={onClick}>
            Update
          </button>
          <div data-testid="state">{state}</div>
        </div>
      );
    };

    render(<Component />);

    // When
    // Then
    expect(screen.getByTestId('state')).toHaveTextContent('0');
  });

  test('It should allow to update the state', async () => {
    // Given
    const { useFocusedState: useState } = connect<State>({
      value: 0,
      other: 'other',
    });

    const Component: React.FunctionComponent = () => {
      const { state, updateState } = useState(lens);

      const onClick = (): void => {
        updateState((state) => state + 1);
      };

      return (
        <div>
          <button data-testid="update" onClick={onClick}>
            Update
          </button>
          <div data-testid="state">{state}</div>
        </div>
      );
    };

    render(<Component />);

    // When
    await userEvent.click(screen.getByTestId('update'));

    // Then
    expect(screen.getByTestId('state')).toHaveTextContent('1');
  });
});

describe('Change detection', () => {
  type State = {
    a: number;
    b: number;
  };

  const aLens = createLens<State, number>({
    get: ({ a }) => a,
    set: (state, a) => ({ ...state, a }),
  });

  const bLens = createLens<State, number>({
    get: ({ b }) => b,
    set: (state, b) => ({ ...state, b }),
  });

  test('A should update without B to render', async () => {
    // Given
    const { useFocusedState: useState } = connect<State>({ a: 0, b: 0 });

    const A: React.FunctionComponent = () => {
      const { state, updateState } = useState(aLens);

      const onClick = (): void => {
        updateState((state) => state + 1);
      };

      return (
        <div>
          <button data-testid="updateA" onClick={onClick}>
            Update
          </button>
          <div>{state}</div>
        </div>
      );
    };

    const bSpy = vi.fn();

    const B: React.FunctionComponent = () => {
      const { state } = useState(bLens);

      React.useEffect(() => {
        bSpy();
      });

      return <div>{state}</div>;
    };

    render(
      <div>
        <A />
        <B />
      </div>
    );
    expect(bSpy).toHaveBeenCalledTimes(1);

    // When
    await userEvent.click(screen.getByTestId('updateA'));

    // Then
    expect(bSpy).toHaveBeenCalledTimes(1); // i.e. initial render only
  });
});
