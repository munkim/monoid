import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import ScaleLoader from 'react-spinners/ScaleLoader';
import Pill from 'src/components/0100_pill';
import Card from 'src/components/0200_card';
import addActionToProject from 'src/mutations/addActionToProject';
import deleteProject from 'src/mutations/deleteProject';
import getAgentConfiguredActions, {
  TGetAgentConfiguredActionsPayload,
  TGetAgentConfiguredActionsResponse,
} from 'src/queries/getAgentConfiguredAction';
import getAgents, {
  TIndexAgentPayload,
  TIndexAgentResponse,
} from 'src/queries/getAgents';
import {
  TProjectDeletePayload,
  TProjectDeleteResponse,
} from 'src/types/project';

interface IProps {
  categoryId?: number;
  excludedAgentId?: number;
}

const AgentsSocket: FC<IProps> = ({ categoryId, excludedAgentId }) => {
  const navigate = useNavigate();
  const [ deletedAgentIds, setDeletedAgentIds ] = useState<number[]>([]);
  const { data: agents, isFetching } = useQuery<
    TIndexAgentPayload,
    unknown,
    TIndexAgentResponse
  >({
    queryKey: [ 'agents', 'category', categoryId ],
    queryFn: () => getAgents({ categoryId }),
  });
  const { data: existingActions } = useQuery<
    TGetAgentConfiguredActionsPayload,
    unknown,
    TGetAgentConfiguredActionsResponse
  >({
    queryKey: [ 'agent', excludedAgentId, 'configuredActions' ],
    queryFn: () =>
      getAgentConfiguredActions({ agentId: Number( excludedAgentId ) }),
    enabled: Number( excludedAgentId || 0 ) > 0,
  });

  const { mutate: destroy } = useMutation<
    TProjectDeleteResponse,
    unknown,
    TProjectDeletePayload
  >( deleteProject );

  const { mutate: addAction } = useMutation( addActionToProject, {
    onSuccess() {
      navigate( `/agents/${excludedAgentId}/config` );
    },
  });

  const handleProjectDeletion = useCallback(
    ( payload: TProjectDeletePayload ) => {
      destroy( payload );
      setDeletedAgentIds( x => [ ...x, payload.id ]);
    },
    [ destroy ],
  );

  const filteredAgents = useMemo(
    () =>
      ( agents || [])
        .filter( x => !deletedAgentIds.includes( x.agentId ))
        .filter( x => ( excludedAgentId ? x.agentId !== excludedAgentId : x )),
    [ agents, deletedAgentIds, excludedAgentId ],
  );

  const isIncluded = useCallback(
    ( id: number ) => existingActions?.some( x => x.expertAgentId === id ),
    [ existingActions ],
  );

  return (
    <div>
      {isFetching && !agents ? (
        <ScaleLoader color="#6D4D64" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-4">
          {filteredAgents.length === 0 ? (
            <div>
              {excludedAgentId ? (
                'No Expert Agent Available'
              ) : (
                <Card to="/agents/new">
                  <div className="flex items-center justify-center">
                    <div className="bg-monoid-900 text-monoid-100 px-4 py-2 rounded inline-block">
                      Create New Agent
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {filteredAgents.map( agent => (
                <motion.div
                  key={agent.agentId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card
                    variant={isIncluded( agent.agentId ) ? 'invert' : undefined}
                    disabled={isIncluded( agent.agentId )}
                    onClick={() => {
                      if ( excludedAgentId ) {
                        addAction({
                          agentId: excludedAgentId,
                          payload: {
                            expertAgentId: agent.agentId,
                            name: agent.name,
                            description: agent.description,
                            userConfiguredArguments: [],
                          },
                        });
                      } else {
                        navigate( `/agents/${agent.agentId}/config` );
                      }
                    }}
                  >
                    <div className="flex items-center justify-between ">
                      <div className="w-full whitespace-nowrap overflow-hidden">
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-semibold">
                            {agent.name}
                          </div>
                          {isIncluded( agent.agentId ) && <Pill>Included</Pill>}
                        </div>
                        <div className="flex text-xs">{agent.description}</div>
                      </div>
                      {!excludedAgentId && (
                        <FontAwesomeIcon
                          icon={faTrash}
                          className="p-4 cursor-pointer"
                          onClick={e => {
                            e.stopPropagation();
                            handleProjectDeletion({ id: agent.agentId });
                          }}
                        />
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentsSocket;
