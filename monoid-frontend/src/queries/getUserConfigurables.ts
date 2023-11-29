import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

export type TGetUserConfigurablesPayload = {
  actionId: number;
};

type TUserConfigurable = {
  dataType: string;
  description: string;
  isRequired: boolean;
  key: string;
  path: string;
  placement: string;
};

export type TGetUserConfigurablesResponse = TUserConfigurable[];

const getUserConfigurables = async ({
  actionId,
}: TGetUserConfigurablesPayload ) => {
  const response = await apiClient.get(
    `/api-action/${actionId}/user-configurables`,
    {
      headers: getRequestHeader(),
    },
  );

  return camelcaseKeys( response.data.user_configurable_parameters, {
    deep: true,
  });
};

export default getUserConfigurables;
