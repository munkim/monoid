import { FC, PropsWithChildren } from 'react';

const Title: FC<PropsWithChildren> = ({ children }) => (
  <div className="text-lg md:text-2xl font-bold mb-2">{children}</div>
);

export default Title;
