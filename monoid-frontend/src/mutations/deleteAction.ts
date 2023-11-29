import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

const deleteAction = async ({ id }: { id: number }) => {
  const response = await apiClient.delete( `/api-action/${id}`, {
    headers: getRequestHeader(),
  });

  return camelcaseKeys( response.data );
};

export default deleteAction;
