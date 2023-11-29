import { FC } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import getApiAction, {
  TGetApiActionPayload,
  TGetApiActionResponse,
} from 'src/queries/getApiAction';

const ActionTitle: FC = () => {
  const { id } = useParams();

  const { data } = useQuery<
    TGetApiActionPayload,
    unknown,
    TGetApiActionResponse
  >({
    queryKey: [ 'api-action', id ],
    queryFn: () => getApiAction({ actionId: Number( id ) }),
    enabled: Number( id || 0 ) > 0,
  });

  return (
    <span className="opacity-50 last-of-type:opacity-100">{` / ${
      data?.actionInfo?.name || '...'
    }`}</span>
  );
};

export default ActionTitle;
