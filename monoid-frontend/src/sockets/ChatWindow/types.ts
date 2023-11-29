import { TParsedAction } from 'src/components/0200_annotated_action_call/utils/parseStreams';

export type TRole =
  | 'user'
  | 'agent'
  | 'system'
  | 'action_call'
  | 'api_response'
  | 'language_response'
  | 'expert_agent' // Remove this because the backend doens't send this anymore
  | 'expert_agent_language_response'
  | 'expert_agent_call_start'
  | 'expert_agent_call_finish';

// TODO: Combine this with TMessage
export type TChatMessage = {
  content: string;
  annotatedActions?: TParsedAction[];
  role: TRole; // TODO: replacethis with messageType (for consistency with backend)
  createdAt: string;
  messageAuthorName?: string;
  messageAuthorType?: string;
};

export type TAgentReadPayload = {
  id: number;
};

export type TAgentReadResponse = {
  agentId: number;
  slug: string;
  subdomain: string;
  name: string;
};

export type TAgentChatConfigReadPayload = {
  slug: string;
  subdomain: string;
};

export type TAgentChatConfigReadResponse = {
  encodedAgentConfig: string;
};

export type TCreateChatSessionPayload = {
  projectId: number;
  title: string;
};

export type TCreateChatSessionResponse = {
  chatSessionUuid: string;
  title: string;
  updatedAt: string;
};

export type TSendMessagePayload = {
  agentId: number;
  chatSessionUuid: string;
  content: string;
  encodedAgentConfig: string;
};

export type TAccountResponse = {
  firstName: string;
  lastName: string;
  email: string;
};

export interface IProps {
  onCreateSession: () => void;
  onResponsePending: () => void;
  onResponseReceived: () => void;
}
