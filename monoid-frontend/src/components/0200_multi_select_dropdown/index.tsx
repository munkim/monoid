import { FC, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { useDebouncedValue, useOutsideClickRef } from 'rooks';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { uniq } from 'lodash';
import Input from '../0100_input';
import Option, { TOption } from './Option';

interface IProps {
  defaultOptions?: TOption[];
  delay?: number;
  disabled?: boolean;
  isFetchingOptions?: boolean;
  options?: TOption[];
  placeholder?: string;
  selectedOptionIds?: number[];
  onBlur?: () => void;
  onChange: ( val: number ) => void;
  onSearch: ( q: string ) => void;
}

const MultiSelectDropdown: FC<IProps> = ({
  defaultOptions = [],
  delay = 250,
  disabled = false,
  isFetchingOptions = false,
  options = [],
  placeholder = 'Select An Option',
  selectedOptionIds = [],
  onBlur,
  onChange,
  onSearch,
}) => {
  const [ isDropdownOpen, setIsDropdownOpen ] = useState( false );
  const [ ref ] = useOutsideClickRef(() => {
    setIsDropdownOpen( x => {
      if ( x ) {
        onBlur?.();
        return false;
      }

      return x;
    });
  });
  const { register, watch } = useForm({
    defaultValues: {
      query: '',
    },
  });
  const { query } = watch();
  const [ debouncedQuery ] = useDebouncedValue( query, delay );

  const selectedOptions = useMemo(() => {
    if ( selectedOptionIds.length === 0 ) return placeholder;

    return uniq( defaultOptions.concat( options ))
      .filter( x => selectedOptionIds.includes( x.id ))
      .map( x => x.name )
      .join( ', ' );
  }, [ defaultOptions, options, placeholder, selectedOptionIds ]);

  useEffect(() => {
    onSearch( debouncedQuery );
  }, [ debouncedQuery, onSearch ]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        className={clsx(
          'flex justify-between items-center w-full border border-monoid-300 px-4 py-2 rounded-md',
          'bg-white disabled:bg-monoid-300',
          'hover:border-monoid-700',
        )}
        onClick={() => setIsDropdownOpen( x => !x )}
      >
        <div>{selectedOptions}</div>
        <FontAwesomeIcon icon={faCaretDown} />
      </button>
      <div className="h-0 w-full">
        <div
          className={clsx(
            'mt-2 border-monoid-300 transition-all duration-300 overflow-auto bg-white absolute z-10 rounded-md',
            isDropdownOpen ? 'border max-h-[50vh] shadow-xl' : 'max-h-0',
          )}
        >
          {!isFetchingOptions ? (
            <div>
              <div className="p-2">
                <Input
                  {...register( 'query' )}
                  className="min-w-[50vw]"
                  placeholder="Search for Options..."
                />
              </div>
              {options.map( option => (
                <Option
                  key={option.id}
                  {...option}
                  isSelected={selectedOptionIds?.includes( option.id )}
                  onChange={onChange}
                />
              ))}
            </div>
          ) : (
            <div className="p-2 flex items-center">
              Fetching Options
              <ScaleLoader
                color="#6D4D64"
                height={24}
                margin={1}
                className="ml-4 mr-2"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiSelectDropdown;
