import { FC, PropsWithChildren } from 'react';
import clsx from 'clsx';

interface IProps extends PropsWithChildren {
  className?: string;
}

const LayoutTwoColumnsFull: FC<IProps> = ({ children, className }) => (
  <div className={clsx( 'grid grid-cols-1 md:grid-cols-2', className )}>
    {children}
  </div>
);

export default LayoutTwoColumnsFull;
