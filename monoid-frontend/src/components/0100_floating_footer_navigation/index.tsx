import { FC, PropsWithChildren } from 'react';

const FloatingFooterNavigation: FC<PropsWithChildren> = ({ children }) => (
  <div className="fixed bottom-4 right-8">{children}</div>
);

export default FloatingFooterNavigation;
