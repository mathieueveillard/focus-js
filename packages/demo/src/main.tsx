import React from 'react';
import ReactDOM from 'react-dom/client';
import Demo from './Demo';
import { connect } from '@focus/react-connect';
import './styles.css';

export type ApplicationState = {
  a: number;
  b: number;
};

export const { useGlobalState, useFocusedState } = connect<ApplicationState>({
  a: 0,
  b: 0,
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>
);
