import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

export type TTestAsApiPayload = {
  actionId: number;
};

export type TTestAsApiResponse = {
  statusCode: number;
  response: string;
  timeTaken: number;
  responseSize: number;
};

const testAsApi = async ( payload: TTestAsApiPayload ) => {
  const response = await apiClient.post(
    `/api-action/api-test`,
    { ...snakecaseKeys( payload, { deep: true }) },
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data );
};

export default testAsApi;
