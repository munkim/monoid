import apiClient from 'src/apiClient';
import snakeCaseKeys from 'snakecase-keys';
import getRequestHeader from 'src/utils/getRequestHeader';
import camelcaseKeys from 'camelcase-keys';
import { snakeCase } from 'lodash';

export type TPayload = {
  agentId: number;
  name?: string;
  categoryIds?: number[];
  description?: string;
  instructions?: string | null;
  slug?: string;
  url?: string;
  agentType?: string;
  isPublic?: boolean;
  llmOption?: string;
  llmApiKey?: string;
};

const updateAgent = async ( payload: TPayload ) => {
  const response = await apiClient.patch(
    `/agent/${payload.agentId}`,
    {
      ...snakeCaseKeys({ ...payload, snakeCaseName: snakeCase( payload.name ) }),
      id: undefined,
    },
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data );
};

export default updateAgent;
