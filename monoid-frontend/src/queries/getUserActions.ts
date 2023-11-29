import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

const getUserActions = async () => {
  const response = await apiClient.get( 'action/list/account', {
    headers: getRequestHeader(),
  });

  return camelcaseKeys( response.data.action_base_list );
};

export default getUserActions;
