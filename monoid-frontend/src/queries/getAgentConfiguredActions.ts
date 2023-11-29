import apiClient from 'src/apiClient';
import camelcaseKeys from 'camelcase-keys';
import getRequestHeader from 'src/utils/getRequestHeader';

const getAgentConfiguredActions = async ({ id }: { id: number }) => {
  const response = await apiClient.get( `/agent/${id}/configured-action`, {
    headers: getRequestHeader(),
  });

  return camelcaseKeys( response.data, { deep: true });
};

export default getAgentConfiguredActions;
