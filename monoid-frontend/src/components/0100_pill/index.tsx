import clsx from 'clsx';
import { FC, HTMLAttributes, PropsWithChildren } from 'react';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark';
}

const Pill: FC<PropsWithChildren<IProps>> = ({
  variant = 'light',
  className,
  children,
}) => (
  <div
    className={clsx(
      'px-2 text-sm  rounded-lg',
      {
        'bg-monoid-100 text-monoid-900': variant === 'light',
        'bg-monoid-900 text-monoid-100': variant === 'dark',
      },
      className,
    )}
  >
    {children}
  </div>
);

export default Pill;
