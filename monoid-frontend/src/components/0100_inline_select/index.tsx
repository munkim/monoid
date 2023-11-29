import clsx from 'clsx';
import { startCase } from 'lodash';
import { FC, ReactNode } from 'react';

interface IProps {
  className?: string;
  options: { label?: string | ReactNode; value: string }[];
  selectedOption: string;
  onChange: ( val: string ) => void;
}

const InlineSelect: FC<IProps> = ({
  className,
  options,
  selectedOption,
  onChange,
}) => (
  <div className="flex">
    {options.map( option => (
      <button
        key={option.value}
        type="button"
        className={clsx(
          'text-center whitespace-pre py-2 border-y border-monoid-300 hover:bg-monoid-900 hover:text-monoid-100',
          'first-of-type:border-r-0 first-of-type:border last-of-type:border-l-0 last-of-type:border',
          'first-of-type:rounded-l last-of-type:rounded-r',
          className,
          {
            'bg-monoid-900 text-monoid-100': selectedOption === option.value,
          },
        )}
        onClick={() => onChange( option.value )}
      >
        {option.label || startCase( option.value )}
      </button>
    ))}
  </div>
);

export default InlineSelect;
