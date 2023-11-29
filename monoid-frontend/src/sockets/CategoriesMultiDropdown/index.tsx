import { FC, useCallback, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import MultiSelectDropdown from 'src/components/0200_multi_select_dropdown';
import getActionCategories from 'src/queries/getActionCategories';

type TActionCategoryListResponse = {
  id: number;
  name: string;
  description: string;
}[];

interface IProps {
  disabled?: boolean;
  selectedOptionIds?: number[];
  onBlur?: () => void;
  onChange: ( val: number[]) => void;
}

const CategoriesMultiDropdown: FC<IProps> = ({
  disabled = false,
  selectedOptionIds = [],
  onBlur,
  onChange,
}) => {
  const [ query, setQuery ] = useState( '' );
  const { data: options, isFetching } = useQuery<
    unknown,
    unknown,
    TActionCategoryListResponse
  >({
    queryKey: [ 'actionCategories' ],
    queryFn: getActionCategories,
  });
  const filteredOptions = useMemo(() => {
    if ( query.trim().length === 0 ) return options;

    return ( options || []).filter(
      x =>
        x.name.toLowerCase().includes( query.toLowerCase()) ||
        x.description.toLowerCase().includes( query.toLowerCase()),
    );
  }, [ options, query ]);

  const handleChange = useCallback(
    ( val: number ) =>
      onChange(
        selectedOptionIds.includes( val )
          ? selectedOptionIds.filter( x => x !== val )
          : [ ...selectedOptionIds, val ],
      ),
    [ onChange, selectedOptionIds ],
  );

  const handleSearch = useCallback(( q: string ) => setQuery( q ), []);

  return (
    <MultiSelectDropdown
      defaultOptions={options}
      delay={100}
      disabled={disabled}
      isFetchingOptions={isFetching}
      options={filteredOptions}
      selectedOptionIds={selectedOptionIds}
      placeholder="Select Categories"
      onBlur={onBlur}
      onChange={handleChange}
      onSearch={handleSearch}
    />
  );
};

export default CategoriesMultiDropdown;
