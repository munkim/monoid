import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

type TPayload = {
  agentId: number;
  chatSessionUuid: string;
  content: string;
  encodedAgentConfig: string;
};

const sendMessage = async ( payload: TPayload ) => {
  const response = await apiClient.post(
    `/chat-session/message`,
    snakecaseKeys( payload ),
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data );
};

export default sendMessage;
