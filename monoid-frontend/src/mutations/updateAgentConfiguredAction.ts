import camelcaseKeys from 'camelcase-keys';
import { snakeCase } from 'lodash';
import snakeCaseKeys from 'snakecase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

type TUserConfiguredArgumentPayload = {
  key: string;
  path: string;
  placement: string;
  value: number | string | boolean;
};

export type TActionConfigurationUpdatePayload = {
  agentId: number;
  agentActionId: number;
  name: string;
  description: string;
  userConfiguredArguments: TUserConfiguredArgumentPayload[];
};

const updateAgentConfiguredAction = async (
  payload: TActionConfigurationUpdatePayload,
) => {
  const response = await apiClient.patch(
    `/agent/${payload.agentId}/configured-action/${payload.agentActionId}`,
    {
      ...snakeCaseKeys(
        { ...payload, snakeCaseName: snakeCase( payload.name ) },
        { deep: true },
      ),
    },
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data );
};

export default updateAgentConfiguredAction;
