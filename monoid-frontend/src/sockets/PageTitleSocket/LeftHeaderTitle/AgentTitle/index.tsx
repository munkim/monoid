// import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FC, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { Link, Outlet, useParams } from 'react-router-dom';
import FullScreenModal from 'src/components/0100_full_screen_modal';

import getAgent from 'src/queries/getAgent';
import AgentBasicSocket from 'src/sockets/AgentBasicSocket';

type TProjectReadPayload = {
  id: number;
};

type TProjectReadResponse = {
  id: number;
  name: string;
};

const AgentTitle: FC = () => {
  const { id } = useParams();
  const [ isAgentBasicOpen, setIsAgetBasicOpen ] = useState( false );
  const { data } = useQuery<TProjectReadPayload, unknown, TProjectReadResponse>(
    {
      queryKey: [ 'agent', id ],
      queryFn: () => getAgent({ id: Number( id ) }),
      enabled: Number( id || 0 ) > 0,
    },
  );

  useEffect(() => {
    setIsAgetBasicOpen( false );
  }, [ id ]);

  return (
    <>
      <span className="opacity-50 last-of-type:opacity-100">
        <Link to={`/agents/${id}`}>{` ${data?.name || '...'}`}</Link>
      </span>
      <Outlet />
      <button type="button" onClick={() => setIsAgetBasicOpen( true )}>
        <FontAwesomeIcon icon={faPenToSquare} className="text-l pl-4" />
      </button>
      <FullScreenModal
        isOpen={isAgentBasicOpen}
        onClose={() => setIsAgetBasicOpen( false )}
      >
        <div className="p-4 text-base font-normal">
          <div className="text-xl font-bold">Basics</div>
          <AgentBasicSocket />
        </div>
      </FullScreenModal>
    </>
  );
};

export default AgentTitle;
