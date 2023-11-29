import { FC, useEffect } from 'react';
import { useQuery } from 'react-query';
import getActionCategories from 'src/queries/getActionCategories';
import Dropdown from '../../components/0100_dropdown';

type TActionCategoryListResponse = {
  id: number;
  name: string;
  description: string;
}[];

interface IProps {
  selectedOption?: number;
  onChange: ( val: number ) => void;
}

const CategoriesDropdown: FC<IProps> = ({ selectedOption, onChange }) => {
  const { data } = useQuery<unknown, unknown, TActionCategoryListResponse>({
    queryKey: [ 'actionCategories' ],
    queryFn: getActionCategories,
  });

  useEffect(() => {
    if ( data && data.length > 0 && Number( selectedOption || 0 ) < 1 ) {
      onChange( data[0].id );
    }
  }, [ data, onChange, selectedOption ]);

  return (
    <Dropdown
      selectedOption={String( selectedOption )}
      options={( data || []).map( x => ({ label: x.name, value: String( x.id ) }))}
      onChange={val => onChange( Number( val ))}
    />
  );
};

export default CategoriesDropdown;
