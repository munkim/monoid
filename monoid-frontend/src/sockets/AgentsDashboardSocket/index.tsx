import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useCallback, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import ScaleLoader from 'react-spinners/ScaleLoader';
import Button from 'src/components/0100_button';
import FloatingFooterNavigation from 'src/components/0100_floating_footer_navigation';
import Card from 'src/components/0200_card';
import deleteProject from 'src/mutations/deleteProject';
import getAgents from 'src/queries/getAgents';
import {
  TIndexProjectsResponse,
  TProjectDeletePayload,
  TProjectDeleteResponse,
} from 'src/types/project';

// TODO: Delete this file

const AgentsDashboardSocket: FC = () => {
  const [ deletedProjectIds, setDeletedProjectIds ] = useState<number[]>([]);
  const { data: projects, isFetching } = useQuery<
    null,
    unknown,
    TIndexProjectsResponse
  >({
    queryKey: 'agents',
    queryFn: () => getAgents({}),
  });
  const { mutate: destroy } = useMutation<
    TProjectDeleteResponse,
    unknown,
    TProjectDeletePayload
  >( deleteProject );

  const handleProjectDeletion = useCallback(
    ( payload: TProjectDeletePayload ) => {
      destroy( payload );
      setDeletedProjectIds( x => [ ...x, payload.id ]);
    },
    [ destroy ],
  );

  return (
    <div>
      {isFetching && !projects ? (
        <ScaleLoader color="#6D4D64" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
          {( projects?.filter( x => !deletedProjectIds.includes( x.id )) || [])
            .length === 0 ? (
            <div className="col-span-1 md:col-span-2 xl:col-span-3 w-full flex justify-center">
              <Link
                className=" w-full max-w-[384px] border border-monoid-300 border-dashed rounded-lg text-center hover:border-monoid-700"
                to="/agents/new"
              >
                <div className="text-xl mt-8 font-bold">Start Your Journey</div>
                <div className="my-8 bg-monoid-900 text-monoid-100 px-4 py-2 rounded inline-block">
                  Create New Agent
                </div>
              </Link>
            </div>
          ) : (
            <AnimatePresence>
              {( projects || [])
                .filter( x => !deletedProjectIds.includes( x.id ))
                .map( project => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card to={`/agents/${project.id}/config`}>
                      <div className="flex items-center justify-between ">
                        <div className="w-full whitespace-nowrap overflow-hidden">
                          <div className="text-xl font-bold flex mb-3">
                            {project.name}
                          </div>
                          <div className="flex text-xs">
                            {project.description}
                          </div>
                        </div>

                        <FontAwesomeIcon
                          icon={faTrash}
                          className="p-4 cursor-pointer"
                          onClick={e => {
                            e.preventDefault();
                            handleProjectDeletion({ id: project.id });
                          }}
                        />
                      </div>
                    </Card>
                  </motion.div>
                ))}
            </AnimatePresence>
          )}
        </div>
      )}

      <FloatingFooterNavigation>
        <div className="flex justify-end">
          <Button variant="invert">
            <Link to="/agents/new" className="px-8 flex items-center">
              <FontAwesomeIcon icon={faPlus} className="text-xl mr-2" />
              Create New Agent
            </Link>
          </Button>
        </div>
      </FloatingFooterNavigation>
    </div>
  );
};

export default AgentsDashboardSocket;
