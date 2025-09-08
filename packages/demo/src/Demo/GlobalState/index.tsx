import React from 'react';
import Code from '../utils/Code';
import H2 from '../utils/H2';
import { useGlobalState } from '../../main';

const Component: React.FunctionComponent = () => {
  const { state } = useGlobalState();

  const { a, b } = state;

  return (
    <div>
      <H2>Global state</H2>
      <Code>{`{ a: ${a}, b: ${b} }`}</Code>
    </div>
  );
};

export default Component;
