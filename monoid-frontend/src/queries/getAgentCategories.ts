import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

type TRawActionCategory = {
  action_id: number;
};

const getActionCategories = async () => {
  const response = await apiClient.get( '/action/category', {
    headers: getRequestHeader(),
  });

  return camelcaseKeys(
    response.data.action_category_list.map(( x: TRawActionCategory ) => ({
      ...x,
      id: x.action_id,
    })),
  );
};

export default getActionCategories;
