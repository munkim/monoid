import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

export type TAddEmailToAllowlistPayload = {
  email: string;
};

export type TAddEmailToAllowlistResponse = {
  message: string;
  status: boolean;
};

const addEmailToAllowlist = async ( payload: TAddEmailToAllowlistPayload ) => {
  const response = await apiClient.post(
    '/account/email-whitelist',
    snakecaseKeys( payload ),
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data );
};

export default addEmailToAllowlist;
