import React from "react";

type Props = {
  children: React.ReactNode;
};

const Component: React.FunctionComponent<Props> = ({ children }) => (
  <h2 className="text-lg font-bold mb-4">{children}</h2>
);

export default Component;
