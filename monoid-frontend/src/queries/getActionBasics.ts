import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import { TActionWithParameterShowPayload } from 'src/types/actions';
import getRequestHeader from 'src/utils/getRequestHeader';

const getActionBasics = async ({
  actionId,
}: TActionWithParameterShowPayload ) => {
  const response = await apiClient.get( `/action/${actionId}/basics`, {
    headers: getRequestHeader(),
  });

  return camelcaseKeys( response.data, { deep: true });
};

export default getActionBasics;
