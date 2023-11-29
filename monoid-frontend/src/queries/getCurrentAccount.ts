import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

const getCurrentAccount = async () => {
  const response = await apiClient.get( '/account', {
    headers: getRequestHeader(),
  });

  return camelcaseKeys( response.data );
};

export default getCurrentAccount;
