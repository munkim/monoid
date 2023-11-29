import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

const getChatSessions = async ({ id }: { id: number }) => {
  const response = await apiClient.get( `/chat-session/list/${id}`, {
    headers: getRequestHeader(),
  });

  return camelcaseKeys( response.data.chat_sessions, { deep: true });
};

export default getChatSessions;
