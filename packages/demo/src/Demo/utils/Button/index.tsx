import React from "react";

type Props = {
  onClick: () => void;
  children: React.ReactNode;
};

const Component: React.FunctionComponent<Props> = ({ onClick, children }) => (
  <button className="rounded bg-violet-200 hover:bg-violet-300 transition-colors px-4 py-2" onClick={onClick}>
    {children}
  </button>
);

export default Component;
