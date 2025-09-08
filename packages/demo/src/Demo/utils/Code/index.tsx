import React from "react";

type Props = {
  children: React.ReactNode;
};

const Component: React.FunctionComponent<Props> = ({ children }) => (
  <div className="rounded bg-slate-200 px-4 py-3 whitespace-pre font-mono">
    {children}
  </div>
);

export default Component;
