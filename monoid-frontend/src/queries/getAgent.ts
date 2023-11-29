import apiClient from 'src/apiClient';
import camelcaseKeys from 'camelcase-keys';
import getRequestHeader from 'src/utils/getRequestHeader';

const getAgent = async ({ id }: { id: number }) => {
  const response = await apiClient.get( `/agent/${id}`, {
    headers: getRequestHeader(),
  });

  return camelcaseKeys( response.data, { deep: true });
};

export default getAgent;
