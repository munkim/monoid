import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

export type TTestAsActionStreamingPayload = {
  actionId: number;
  userMessage: string;
};

const testAsActionStreaming = async (
  payload: TTestAsActionStreamingPayload,
) => {
  const response = await apiClient.post(
    `/api-action/action-test-stream`,
    { ...snakecaseKeys( payload, { deep: true }) },
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data );
};

export default testAsActionStreaming;
