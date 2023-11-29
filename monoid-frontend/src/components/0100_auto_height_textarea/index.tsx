import React, { forwardRef, useRef } from 'react';
import clsx from 'clsx';

type Props = {
  placeholder?: string;
  value: string;
  className?: string;
  autoFocus?: boolean;
  onChange: ( e: React.ChangeEvent<HTMLTextAreaElement> ) => void;
  onKeyUp?: ( e: React.KeyboardEvent<HTMLTextAreaElement> ) => void;
  onKeyDown?: ( e: React.KeyboardEvent<HTMLTextAreaElement> ) => void;
};

const AutoHeightTextarea = forwardRef(
  (
    {
      placeholder,
      value,
      className,
      autoFocus,
      onChange,
      onKeyUp,
      onKeyDown,
    }: Props,
    outerRef: any,
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>( null );
    const ref = outerRef || internalRef;

    return (
      <div className="relative">
        <div
          className={clsx(
            className,
            'invisible whitespace-pre-wrap break-all overflow-y-auto max-h-100',
          )}
        >
          {!value ? placeholder : value.replace( /\n$/, '\n ' )}
        </div>
        <textarea
          ref={ref}
          autoFocus={autoFocus}
          className={clsx(
            className,
            'absolute inset-0 resize-none overflow-auto max-h-100',
          )}
          placeholder={placeholder}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          value={value}
        />
      </div>
    );
  },
);

export default AutoHeightTextarea;
