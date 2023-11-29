import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

type TRawAction = {
  action_id: number;
};

const getActions = async ({ categoryId }: { categoryId: string }) => {
  const response = await apiClient.get(
    categoryId === 'my_actions'
      ? '/api-action/list/account'
      : `/api-action/category/${categoryId}`,
    {
      headers: getRequestHeader(),
    },
  );

  return camelcaseKeys(
    response.data.action_info_list.map(( x: TRawAction ) => ({
      ...x,
      id: x.action_id,
    })),
  );
};

export default getActions;
