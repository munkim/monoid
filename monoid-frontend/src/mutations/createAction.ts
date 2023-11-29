import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import apiClient from 'src/apiClient';
import { TRecursive } from 'src/types/recursive';
import getRequestHeader from 'src/utils/getRequestHeader';

export type TApiActionCreatePayload = {
  actionInfo: {
    name: string;
    snakeCaseName: string;
    description: string;
    followupPrompt: string;
    isPublic: boolean;
    isUserConfirmationNeeded: boolean;
    isAdminApprovalNeeded: boolean;
  };
  apiInfo: {
    method: string;
    templateUrl: string;
    headers: TRecursive;
    queryParameters: TRecursive;
    pathParameters: TRecursive;
    body: TRecursive;
  };
  categoryIds: number[];
};

const createAction = async ( payload: TApiActionCreatePayload ) => {
  const response = await apiClient.post(
    '/api-action',
    { ...snakecaseKeys( payload, { deep: true }) },
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data );
};

export default createAction;
