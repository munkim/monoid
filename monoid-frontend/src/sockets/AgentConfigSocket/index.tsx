import { faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FC } from 'react';
import { useQuery } from 'react-query';
import { Link, useParams } from 'react-router-dom';
import Button from 'src/components/0100_button';
import FloatingFooterNavigation from 'src/components/0100_floating_footer_navigation';
import LayoutOneColumnCentered from 'src/components/0100_layout_one_column_centered';
import AgentActions from 'src/components/0300_agent_actions';
import AgentType from 'src/components/0300_agent_type';
import LLMModel from 'src/components/0300_llm_model';
import getAgent from 'src/queries/getAgent';
import getAgentConfiguredActions, {
  TGetAgentConfiguredActionsPayload,
  TGetAgentConfiguredActionsResponse,
} from 'src/queries/getAgentConfiguredAction';

type TProjectReadPayload = {
  id: number;
};

type TProjectReadResponse = {
  id: number;
  name: string;
  description: string;
  slug: string;
  url: string;
  agentType: string;
  isEditable: boolean;
  isPublic: boolean;
  llmOption: string;
  llmApiKey: string;
};

const AgentConfigSocket: FC = () => {
  const { id } = useParams();
  const { data } = useQuery<TProjectReadPayload, unknown, TProjectReadResponse>(
    {
      queryKey: [ 'agent', id ],
      queryFn: () => getAgent({ id: Number( id ) }),
      enabled: Number( id || 0 ) > 0,
    },
  );
  const { data: actions, isFetching } = useQuery<
    TGetAgentConfiguredActionsPayload,
    unknown,
    TGetAgentConfiguredActionsResponse
  >({
    queryKey: [ 'agent', id, 'configuredActions' ],
    queryFn: () => getAgentConfiguredActions({ agentId: Number( id ) }),
    enabled: Number( id || 0 ) > 0,
  });

  return (
    <>
      <LayoutOneColumnCentered extendXl>
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-4">
          <LLMModel 
            llmOption={data?.llmOption} 
            llmApiKey={data?.llmApiKey}
            isEditable={data?.isEditable}
          />
          <AgentType agentType={data?.agentType} />
          <AgentActions
            agentName={data?.name}
            agentDescription={data?.description}
            actions={actions || []}
            isEditable={data?.isEditable}
            isFetching={isFetching}
          />
        </div>
      </LayoutOneColumnCentered>
      <FloatingFooterNavigation>
        <Button variant="invert">
          <Link to={`/chat/${id}`} className="px-16 flex items-center">
            <FontAwesomeIcon icon={faCommentDots} className="pr-2 text-xl" />
            Open Chat UI
          </Link>
        </Button>
      </FloatingFooterNavigation>
    </>
  );
};

export default AgentConfigSocket;
