type TAction = {
  name: string;
  description: String;
};

type TParameter = {
  parameterKey: string;
  description: string;
  dataType: 'string' | 'number' | 'boolean';
};

type TParameterForUpstream = {
  parameter_key: string;
  value: string | number | boolean;
};

type TActionWithId = TAction & { id: number };

export type TActionForUpstream = {
  action_id: number;
  configured_arguments: TParameterForUpstream[];
};

export type TActionIndexPayload = { categoryId: number };
export type TActionsResponse = TActionWithId[];
export type TActionShowPayload = { actionId: number };
export type TActionShowResponse = TActionWithId;
export type TActionWithConfigurableParameters = TActionWithId & {
  configurableParameters: { [key: string]: string };
};
export type TActionWithParameterShowPayload = { actionId: number };
export type TActionWithParameterShowResponse = TActionWithId & {
  configurableParameters: TParameter[];
};
