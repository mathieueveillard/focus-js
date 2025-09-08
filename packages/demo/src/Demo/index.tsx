import React from 'react';
import A from './A';
import B from './B';
import GlobalState from './GlobalState';
import H1 from './utils/H1';

const Component: React.FunctionComponent = () => (
  <div className="m-10">
    <H1>@focus/react-connect</H1>
    <div className="grid grid-rows-2 grid-flow-col gap-6">
      <GlobalState />
      <A />
      <div></div>
      <B />
    </div>
  </div>
);

export default Component;
