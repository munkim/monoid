import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

export type TTestAsActionPayload = {
  actionId: number;
  userMessage: string;
};

export type TTestAsActionResponse = {
  apiStatus: number;
  response: string;
  timeTaken: number;
};

const testAsAction = async ( payload: TTestAsActionPayload ) => {
  const response = await apiClient.post(
    `/api-action/action-test`,
    { ...snakecaseKeys( payload, { deep: true }) },
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data );
};

export default testAsAction;
