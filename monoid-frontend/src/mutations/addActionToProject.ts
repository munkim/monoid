import { snakeCase } from 'lodash';
import snakeCaseKeys from 'snakecase-keys';
import apiClient from 'src/apiClient';
import { TUserConfiguredArgument } from 'src/types/userConfiguredArgument';
import getRequestHeader from 'src/utils/getRequestHeader';

type TPayload = {
  actionId?: number;
  expertAgentId?: number;
  name: string;
  description: string;
  userConfiguredArguments?: TUserConfiguredArgument[];
};

const addActionToProject = async ({
  agentId,
  payload,
}: {
  agentId: number;
  payload: TPayload;
}) => {
  const response = await apiClient.post(
    `/agent/${agentId}/configured-action`,
    snakeCaseKeys({ ...payload, snakeCaseName: snakeCase( payload.name ) }),
    { headers: getRequestHeader() },
  );

  return response.data;
};

export default addActionToProject;
