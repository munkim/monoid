import camelcaseKeys from 'camelcase-keys';
import snakeCaseKeys from 'snakecase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

const createChatSession = async ({
  projectId,
  title,
}: {
  projectId: number;
  title: string;
}) => {
  const response = await apiClient.post(
    `/chat-session`,
    {
      ...snakeCaseKeys({
        agentId: projectId,
        title,
      }),
    },
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data );
};

export default createChatSession;
