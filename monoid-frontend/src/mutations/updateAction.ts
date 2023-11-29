import camelcaseKeys from 'camelcase-keys';
import { omit } from 'lodash';
import snakecaseKeys from 'snakecase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

// type TParameter = {
//   parameterKey: string;
//   argumentProvider: string;
//   dataType: string;
//   description: string;
//   isRequired: boolean;
//   overridingArgument?: string;
//   placement: string;
// };

// type TPayload = {
//   id: number;
//   name: string;
//   categoryIds: number[];
//   snakeCaseName: string;
//   description: string;
//   isPublic: boolean;
//   method: string;
//   templateUrl: string;
//   parameters: TParameter[];
// };

type TRecursive = { [key: string]: TRecursive } | string;

export type TApiActionUpdatePayload = {
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
  id: number;
};

const updateAction = async ( payload: TApiActionUpdatePayload ) => {
  const response = await apiClient.patch(
    `/api-action/${payload.id}`,
    {
      ...snakecaseKeys( omit( payload, 'apiInfo' ), {
        deep: true,
      }),
      api_info: {
        body: payload.apiInfo.body,
        headers: payload.apiInfo.headers,
        method: payload.apiInfo.method,
        path_parameters: payload.apiInfo.pathParameters,
        query_parameters: payload.apiInfo.queryParameters,
        template_url: payload.apiInfo.templateUrl,
      },
    },
    { headers: getRequestHeader() },
  );

  return camelcaseKeys( response.data, { deep: true });
};

export default updateAction;
