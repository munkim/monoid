import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation } from 'react-query';
import removeActionFromAgent from 'src/mutations/removeActionFromAgent';

import ActionConfigurationSocket from 'src/sockets/ActionConfigurationSocket';
import ScaleLoader from 'react-spinners/ScaleLoader';

import { TUserConfiguredArgument } from 'src/types/userConfiguredArgument';
import Card from '../0200_card';

type TAction = {
  actionId: number | null;
  agentId: number;
  configuredActionId: number;
  description: string;
  expertAgentId: number | null;
  name: string;
  userConfiguredArguments: TUserConfiguredArgument[];
};

interface IProps {
  agentName?: string;
  agentDescription?: string;
  actions: TAction[];
  isFetching?: boolean;
  isEditable?: boolean;
}

const AgentActions: FC<IProps> = ({
  agentName,
  agentDescription,
  actions,
  isFetching,
  isEditable,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ deletedActionIds, setDeletedActionIds ] = useState<number[]>([]);

  const { mutate: removeAction } = useMutation( removeActionFromAgent );

  return (
    <div>
      <div className="font-bold mb-2 text-2xl border-b border-monoid-700">
        Actions
      </div>
      <div>Things your agent can do to solve a given input</div>
      {isFetching ? (
        <div className="mt-8">
          <ScaleLoader color="#6D4D64" />
        </div>
      ) : (
        <AnimatePresence>
          {actions
            .filter( x => !deletedActionIds.includes( x.configuredActionId ))
            .sort(( a, b ) => a.name.localeCompare( b.name ))
            .map( action => (
              <motion.div
                key={action.configuredActionId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="h-auto mt-2" variant="white">
                  <div
                    key={action.configuredActionId}
                    className="flex justify-between"
                  >
                    <Link
                      to={
                        action.expertAgentId
                          ? `/agents/${action.expertAgentId}`
                          : `/actions/${action.actionId}`
                      }
                      className="flex items-center gap-4 font-semibold"
                    >
                      <div className="text-xl">
                        {action.expertAgentId ? '🤖' : '⚡'}
                      </div>
                      <div className="hover:underline">{action.name}</div>
                    </Link>
                    {isEditable && (
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="mt-1"
                        onClick={e => {
                          e.preventDefault();
                          setDeletedActionIds([
                            ...deletedActionIds,
                            action.configuredActionId,
                          ]);
                          removeAction({
                            agentId: Number( id ),
                            configuredActionId: action.configuredActionId,
                          });
                        }}
                      />
                    )}
                  </div>
                  <ActionConfigurationSocket
                    agentName={agentName}
                    agentDescription={agentDescription}
                    agentActionId={action.configuredActionId}
                    actionId={Number( action.actionId )}
                    configuredArguments={action.userConfiguredArguments}
                  />
                </Card>
              </motion.div>
            ))}
        </AnimatePresence>
      )}
      <Card
        className="mt-4 h-auto"
        variant="white"
        onClick={() => navigate( `/agents/${id}/actions` )}
      >
        <div className="font-bold text-3xl -mt-1">+</div>
      </Card>
    </div>
  );
};

export default AgentActions;
