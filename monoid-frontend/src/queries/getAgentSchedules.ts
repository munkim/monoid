import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

const getAgentSchedules = async ({ id }: { id: number }) => {
  const response = await apiClient.get( `/agent/${id}/schedule`, {
    headers: getRequestHeader(),
  });

  return camelcaseKeys( response.data );
};

export default getAgentSchedules;
