import apiClient from 'src/apiClient';
import snakecaseKeys from 'snakecase-keys';
import getRequestHeader from 'src/utils/getRequestHeader';
import { snakeCase } from 'lodash';

type TPayload = {
  name: string;
  description: string;
  subdomain: string;
  slug: string;
  url: string;
  agentType: string;
  isPublic: boolean;
};

const createAgent = async ( payload: TPayload ) => {
  const response = await apiClient.post(
    '/agent',
    {
      ...snakecaseKeys({ ...payload, snakeCaseName: snakeCase( payload.name ) }),
    },
    { headers: getRequestHeader() },
  );

  return response.data;
};

export default createAgent;
