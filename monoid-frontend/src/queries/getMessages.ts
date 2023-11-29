import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import { TRole } from 'src/sockets/ChatWindow/types';
import getRequestHeader from 'src/utils/getRequestHeader';

export type TGetMessagesPayload = {
  projectId: number;
  chatSessionId: string;
};

// TODO: Combine this with TChatMessage
type TMessage = {
  actionName: string | null;
  content: string;
  role: TRole; // TODO: replacethis with messageType (for consistency with backend)
  createdAt: string;
  nestingLevel: number;
  messageAuthorName: string;
  messageAuthorType: string;
};

export type TGetMessagesResponse = TMessage[];

type TRawMessage = {
  message_type: TRole;
};

const getMessages = async ({
  projectId,
  chatSessionId,
}: TGetMessagesPayload ) => {
  const response = await apiClient.get(
    `/chat-session/${chatSessionId}?agent_id=${projectId}`,
    { headers: getRequestHeader() },
  );

  return camelcaseKeys(
    response.data.session_messages.map(( x: TRawMessage ) => ({
      ...x,
      role: x.message_type,
    })),
    { deep: true },
  );
};

export default getMessages;
