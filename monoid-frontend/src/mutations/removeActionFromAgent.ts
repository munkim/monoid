import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

const removeActionFromAgent = async ({
  agentId,
  configuredActionId,
}: {
  agentId: number;
  configuredActionId: number;
}) => {
  const response = await apiClient.delete(
    `/agent/${agentId}/configured-action/${configuredActionId}`,
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data );
};

export default removeActionFromAgent;
