import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import { TUserConfiguredArgument } from 'src/types/userConfiguredArgument';
import getRequestHeader from 'src/utils/getRequestHeader';

export type TGetAgentConfiguredActionsPayload = {
  agentId: number;
};

type TAgentConfiguredAction = {
  actionId: number | null;
  agentId: number;
  configuredActionId: number;
  description: string;
  expertAgentId: number | null;
  name: string;
  userConfiguredArguments: TUserConfiguredArgument[];
};

export type TGetAgentConfiguredActionsResponse = TAgentConfiguredAction[];

const getAgentConfiguredActions = async (
  payload: TGetAgentConfiguredActionsPayload,
) => {
  const response = await apiClient.get(
    `/agent/${payload.agentId}/configured-action`,
    {
      headers: getRequestHeader(),
    },
  );

  return camelcaseKeys( response.data, { deep: true });
};

export default getAgentConfiguredActions;
