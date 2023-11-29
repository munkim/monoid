import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

const getActionDetails = async ({ actionId }: { actionId: number }) => {
  const response = await apiClient.get( `/action/${actionId}/details`, {
    headers: getRequestHeader(),
  });

  return camelcaseKeys( response.data, { deep: true });
};

export default getActionDetails;
