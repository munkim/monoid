import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import { FC, InputHTMLAttributes, forwardRef } from 'react';

interface IProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: any;
  isError?: boolean;
  icon?: {
    type?: IconDefinition;
    className?: string;
  };
  color?: string;
  onIconClick?: () => void;
}

const Input: FC<IProps> = forwardRef<HTMLInputElement, IProps>(
  (
    {
      isError,
      icon,
      onIconClick,
      className,
      color = 'text-monoid-900',
      ...props
    },
    ref,
  ) => (
    <div className="flex text-monoid-700 focus-within:text-monoid-900 hover:text-monoid-900 w-full">
      <input
        ref={ref}
        type="text"
        className={clsx(
          'bg-white rounded p-2 border',
          'active:border-monoid-700',
          'hover:border-monoid-700',
          'disabled:cursor-not-allowed disabled:bg-monoid-300',
          {
            'border-red-500': isError,
          },
          className,
          color,
        )}
        {...props}
      />
      {icon && icon.type && (
        <FontAwesomeIcon
          icon={icon.type}
          className={clsx( 'mt-3 -ml-8', icon.className )}
          onClick={onIconClick}
        />
      )}
    </div>
  ),
);

export default Input;
