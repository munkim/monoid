import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

export type TUpdateAccountPayload = {
  firstName: string;
  lastName: string;
};

export type TUpdateAccountResponse = {
  firstName: string;
  lastName: string;
};

const updateAccount = async ( payload: TUpdateAccountPayload ) => {
  const response = await apiClient.patch(
    '/account',
    { ...snakecaseKeys( payload ) },
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data );
};

export default updateAccount;
