import camelcaseKeys from 'camelcase-keys';
import { omit } from 'lodash';
import snakeCaseKeys from 'snakecase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

type TPayload = {
  id: number;
  inputPrompt: string;
  scheduleExpression: string;
  scheduleExpressionTimezone: string;
  startDate: Date;
  endDate?: Date;
  targetEmail?: string;
  targetNumber?: string;
};

const createSchedule = async ( payload: TPayload ) => {
  const response = await apiClient.post(
    `/agent/${payload.id}/schedule`,
    {
      ...snakeCaseKeys( omit( payload, 'id' )),
    },
    {
      headers: getRequestHeader(),
    },
  );

  return camelcaseKeys( response.data );
};

export default createSchedule;
