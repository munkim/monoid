import { FC, useState } from 'react';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { useOutsideClickRef } from 'rooks';
import { startCase } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface IProps {
  isDisabled?: boolean;
  options: { label?: string; value: string; className?: string }[];
  selectedOption?: string;
  className?: string;
  onChange: ( val: string ) => void;
}

const Dropdown: FC<IProps> = ({
  isDisabled = false,
  className,
  options,
  selectedOption,
  onChange,
}) => {
  const [ isOpen, setIsOpen ] = useState( false );
  const selected = options.find( x => x.value === selectedOption );
  const [ ref ] = useOutsideClickRef(() => setIsOpen( false ));

  return (
    <div ref={ref} className={clsx( className, 'relative' )}>
      <button
        type="button"
        className={clsx(
          'flex justify-between items-center w-full border border-monoid-300 px-4 py-2 rounded-md',
          'hover:border-monoid-700',
          isDisabled ? 'bg-monoid-300 cursor-not-allowed' : 'bg-white',
        )}
        onClick={() => !isDisabled && setIsOpen( x => !x )}
      >
        <div className={selected?.className}>
          {selected?.label || startCase( selected?.value )}
        </div>
        <FontAwesomeIcon icon={faCaretDown} />
      </button>
      <div className="absolute h-0 z-10">
        <div
          className={clsx(
            'border-monoid-300 bg-white rounded mt-2 text-left overflow-auto transition-all ',
            isOpen ? 'border max-h-[33vh]' : 'border-0 max-h-0',
          )}
        >
          {options.map( option => (
            <button
              key={option.value}
              type="button"
              className={clsx(
                'text-left block border-l-4 px-2 py-2 w-full hover:bg-monoid-300 min-w-[128px]',
                option.className,
                selectedOption === option.value
                  ? 'border-monoid-700'
                  : 'border-monoid-300',
              )}
              onClick={() => {
                onChange( option.value );
                setTimeout(() => setIsOpen( false ), 100 );
              }}
            >
              {option.label || startCase( option.value )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dropdown;
