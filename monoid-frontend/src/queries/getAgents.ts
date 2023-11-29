import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

export type TIndexAgentPayload = {
  categoryId?: number;
};

type TAgent = {
  agentConfig: { [key: string]: unknown };
  agentId: number;
  agentType: string;
  description: string;
  instructions: string | null;
  isEditable: boolean;
  isPublic: boolean;
  name: string;
  slug: string;
  snakeCaseName: string | null;
  subdomain: string;
};

export type TIndexAgentResponse = TAgent[];

const getAgents = async ( params = {} as TIndexAgentPayload ) => {
  const response = await apiClient.get(
    params.categoryId ? `/agent/category/${params.categoryId}` : '/agent',
    {
      headers: getRequestHeader(),
    },
  );

  return camelcaseKeys( response.data.agent_base_list );
};

export default getAgents;
