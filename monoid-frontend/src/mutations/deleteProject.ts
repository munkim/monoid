import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import { TProjectDeletePayload } from 'src/types/project';
import getRequestHeader from 'src/utils/getRequestHeader';

const deleteProject = async ( payload: TProjectDeletePayload ) => {
  const response = await apiClient.delete( `/agent/${payload.id}`, {
    headers: getRequestHeader(),
  });

  return camelcaseKeys( response.data );
};

export default deleteProject;
