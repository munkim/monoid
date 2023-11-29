import { FC } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import AgentBasic from 'src/components/0300_agent_basic';
import useUserContext from 'src/hooks/useUserContext';
import createAgent from 'src/mutations/createAgent';
import updateAgent from 'src/mutations/updateAgent';
import getAgent from 'src/queries/getAgent';

type TProjectReadPayload = {
  id: number;
};

type TProjectReadResponse = {
  agentId: number;
  name: string;
  description: string;
  instructions: string | null;
  categories: {
    categoryId: number;
  }[];
  slug: string;
  url: string;
  agentType: string;
  isEditable: boolean;
  isPublic: boolean;
  llmOption: string;
  llmApiKey: string;
};

type TProjectCreatePayload = Omit<
  TProjectReadResponse,
  'agentId' | 'categories' | 'isEditable' | 'llmOption' | 'llmApiKey'
> & {
  subdomain: string;
  categoryIds?: number[];
};
type TProjectUpdatePayload = Partial<
  Omit<TProjectReadResponse, 'isEditable'>
> & {
  agentId: number;
};
type TProjectCreateResponse = { agent_id: number };
type TProjectUpdateResponse = TProjectReadResponse;

const AgentBasicSocket: FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const {
    user: { subdomain },
  } = useUserContext();

  const { data } = useQuery<TProjectReadPayload, unknown, TProjectReadResponse>(
    {
      queryKey: [ 'agent', id ],
      queryFn: () => getAgent({ id: Number( id ) }),
      enabled: Number( id || 0 ) > 0,
    },
  );

  const { mutate: create, isLoading: isCreating } = useMutation<
    TProjectCreateResponse,
    unknown,
    TProjectCreatePayload
  >( createAgent, {
    onSuccess( data ) {
      navigate( `/agents/${data.agent_id}/config` );
    },
  });

  const { mutate: update, isLoading: isUpdating } = useMutation<
    TProjectUpdateResponse,
    unknown,
    TProjectUpdatePayload
  >( updateAgent, {
    onSuccess() {
      queryClient.invalidateQueries([ 'agent', id ]);
    },
  });

  return (
    <AgentBasic
      data={data}
      isCreating={isCreating}
      isUpdating={isUpdating}
      isPersisted={data && data.agentId > 0}
      subdomain={subdomain}
      onCreate={create}
      onUpdate={x => update({ ...x, agentId: Number( id ) })}
    />
  );
};

export default AgentBasicSocket;
