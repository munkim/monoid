import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import { TCategory } from 'src/types/category';
import { TRecursive } from 'src/types/recursive';
import getRequestHeader from 'src/utils/getRequestHeader';

export type TGetApiActionPayload = {
  actionId: number;
};

export type TGetApiActionResponse = {
  actionId: number;
  name: string;
  categories: TCategory[];
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
  raw: {
    headers: TRecursive;
    queryParameters: TRecursive;
    pathParameters: TRecursive;
    body: TRecursive;
  };
  isEditable: boolean;
  creatorId: string;
};

const getApiAction = async ({ actionId }: { actionId: number }) => {
  const response = await apiClient.get( `/api-action/${actionId}`, {
    headers: getRequestHeader(),
  });

  return {
    ...camelcaseKeys( response.data, { deep: true }),
    raw: {
      headers: response.data.api_info.headers,
      queryParameters: response.data.api_info.query_parameters,
      pathParameters: response.data.api_info.path_parameters,
      body: response.data.api_info.body,
    },
  };
};

export default getApiAction;
