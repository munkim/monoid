import { ButtonHTMLAttributes, FC } from 'react';
import clsx from 'clsx';

interface IProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  rounded?: boolean;
  variant?:
    | 'highlightBorder'
    | 'invert'
    | 'link'
    | 'softLight'
    | 'white'
    | 'whiteWithBorder';
}

const Button: FC<IProps> = ({
  children,
  className,
  disabled,
  variant,
  rounded = true,
  ...props
}) => (
  <button
    type="button"
    className={clsx(
      'border py-2 px-4 transition-all',
      rounded && 'rounded-md',
      !disabled && !variant && ' border-monoid-300 hover:border-monoid-700',
      !disabled && variant === 'highlightBorder' && 'border-monoid-700',
      !disabled && variant === 'softLight' && 'bg-monoid-300 text-monoid-900',
      !disabled && variant === 'invert' && 'bg-monoid-900 text-monoid-100',
      !disabled && variant === 'link' && 'bg-transparent',
      !disabled && variant === 'white' && 'bg-white border-monoid-300',
      !disabled &&
        variant === 'whiteWithBorder' &&
        'bg-white border-monoid-700',
      disabled && 'cursor-not-allowed',
      disabled && variant === 'white' && 'text-monoid-900/25 bg-white',
      disabled && variant === 'invert' && 'bg-monoid-700 text-monoid-300',
      className,
    )}
    {...props}
  >
    {children}
  </button>
);

export default Button;
