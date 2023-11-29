import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

const deleteChatSession = async ({
  projectId,
  chatSessionUuid,
}: {
  projectId: number;
  chatSessionUuid: string;
}) => {
  const response = await apiClient.delete(
    `/chat-session/${chatSessionUuid}?agent_id=${projectId}`,
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data );
};

export default deleteChatSession;
