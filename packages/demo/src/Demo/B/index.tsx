import React, { useEffect } from 'react';
import Code from '../utils/Code';
import Button from '../utils/Button';
import H2 from '../utils/H2';
import { createLens } from '@focus/react-connect';
import { ApplicationState, useFocusedState } from '../../main';

const lens = createLens<ApplicationState, number>({
  get: ({ b }) => b,
  set: (state, b) => ({ ...state, b }),
});

const Component: React.FunctionComponent = () => {
  const { state, getSynchronousState, updateState } = useFocusedState(lens);

  const increment = (): void => {
    console.log("[B] User clicks the 'Increment' button");
    updateState((n) => n + 1);
    console.log('[B] New (synchronous) value for b: ', getSynchronousState());
  };

  useEffect(() => {
    console.log('[B] Component renders');
  });

  return (
    <div>
      <H2>Component B</H2>
      <div className="flex gap-2">
        <Code>b: {state}</Code>
        <Button onClick={increment}>Increment b</Button>
      </div>
    </div>
  );
};

export default Component;
