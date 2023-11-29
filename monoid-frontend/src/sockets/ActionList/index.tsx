import { AnimatePresence, motion } from 'framer-motion';
import { FC, useCallback, useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import Card from 'src/components/0200_card';
import ActionCard from 'src/components/0300_action_card';
import deleteAction from 'src/mutations/deleteAction';
import { TUserConfiguredArgument } from 'src/types/userConfiguredArgument';

type TAction = {
  id: number;
  name: string;
  description: string;
};

interface IProps {
  actions: TAction[];
  selectedActionIds: number[];
  isEditable: boolean;
  onActionChange: ({
    action,
    data,
  }: {
    action: TAction;
    data?: Omit<TUserConfiguredArgument, 'value'>[];
  }) => void;
}

const ActionList: FC<IProps> = ({
  actions,
  selectedActionIds,
  isEditable,
  onActionChange,
}) => {
  const navigate = useNavigate();
  const [ deletedActionIds, setDeletedActionIds ] = useState<number[]>([]);
  const { mutate: destroy } = useMutation( deleteAction );
  const isIncluded = useCallback(
    ( actionId: number ) => selectedActionIds.includes( actionId ),
    [ selectedActionIds ],
  );
  const availableActions = actions.filter(
    x => !deletedActionIds.includes( x.id ),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-4">
      {availableActions.length > 0 ? (
        <AnimatePresence>
          {availableActions.map( action => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ActionCard
                action={action}
                isIncluded={isIncluded( action.id )}
                isEditable={isEditable}
                onClick={data => onActionChange({ action, data })}
                onDelete={({ id }) => {
                  setDeletedActionIds( prev => [ ...prev, id ]);
                  destroy({ id });
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      ) : (
        <Card onClick={() => navigate( '/actions/new' )}>
          <div className="flex items-center justify-center">
            <div className="bg-monoid-900 text-monoid-100 px-4 py-2 rounded inline-block">
              Create New Action
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ActionList;
