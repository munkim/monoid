import clsx from 'clsx';
import { FC, TextareaHTMLAttributes, forwardRef } from 'react';

interface IProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  isError?: boolean;
}

const TextArea: FC<IProps> = forwardRef<HTMLTextAreaElement, IProps>(
  ({ isError, className, ...props }, ref ) => (
    <textarea
      ref={ref}
      className={clsx(
        'rounded p-2 text-monoid-900 border border-monoid-300  hover:border-monoid-700 active:border-monoid-700',
        'bg-white disabled:bg-monoid-300',
        { 'border-red-500': isError },
        className,
      )}
      {...props}
    />
  ),
);

export default TextArea;
