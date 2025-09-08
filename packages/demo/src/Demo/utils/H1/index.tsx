import React from "react";

type Props = {
  children: React.ReactNode;
};

const Component: React.FunctionComponent<Props> = ({ children }) => (
  <h2 className="text-xl font-bold mb-10">{children}</h2>
);

export default Component;
