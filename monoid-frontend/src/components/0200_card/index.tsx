import { ButtonHTMLAttributes, FC, PropsWithChildren, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Button from '../0100_button';

interface IProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: ReactNode;
  to?: string;
  variant?: 'highlightBorder' | 'invert' | 'whiteWithBorder' | 'white' | 'link' | 'softLight';
  rounded?: boolean;
  height?: 'constrained' | 'full';
  onClick?: () => void;
}

const Card: FC<PropsWithChildren<IProps>> = ({
  className,
  children,
  to,
  variant = 'white',
  rounded = true,
  height = 'constrained',
  onClick,
  ...props
}) => {
  const element = (
    <Button
      className={clsx( 'w-full', className, {
        'h-24': height === 'constrained',
      })}
      variant={variant}
      rounded={rounded}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );

  if ( to ) {
    return <Link to={to}>{element}</Link>;
  }

  return element;
};

export default Card;
