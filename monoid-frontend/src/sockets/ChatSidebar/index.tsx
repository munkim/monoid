import React, { FC, useCallback, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { isBefore, parseISO } from 'date-fns';
import { useMutation } from 'react-query';

import Button from 'src/components/0100_button';
import deleteChatSession from 'src/mutations/deleteChatSession';
import useOutsideClick from 'src/hooks/useOutsideClick';
import PulseLoader from 'react-spinners/PulseLoader';

type TChatSession = {
  chatSessionUuid: string;
  title: string;
  updatedAt: string;
};

interface IProps {
  chatSessions: TChatSession[];
  isFetching: boolean;
  isSessionSwitcherEnabled: boolean;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  excludedElementRef: React.MutableRefObject<null>;
}

const ChatSidebar: FC<IProps> = ({
  chatSessions,
  isFetching,
  isSessionSwitcherEnabled,
  menuOpen = false,
  setMenuOpen,
  excludedElementRef,
}) => {
  const navigate = useNavigate();
  const { id, sessionId } = useParams();
  const [ deletedActionIds, setDeletedActionIds ] = useState<string[]>([]);
  const generateLink = useCallback(
    ( uuid: string ) => `/chat/${id}/${uuid}`,
    [ id ],
  );
  const { mutate: deleteSession } = useMutation( deleteChatSession );
  const ref = useRef<HTMLDivElement | null>( null );

  useOutsideClick( ref, [ excludedElementRef.current ], () => {
    if ( menuOpen ) {
      setMenuOpen( false );
    }
  });

  return (
    <div className="flex flex-col h-full p-[20px] w-[320px]" ref={ref}>
      <Button
        className={clsx(
          'flex items-center justify-center gap-[8px] px-[10px] py-[6px] mb-[20px] font-bold bg-white border shadow-lg text-[15px]',
          !isSessionSwitcherEnabled &&
            'opacity-50 pointer-events-none cursor-not-allowed',
        )}
        onClick={() => navigate( `/chat/${id}/new` )}
      >
        <FontAwesomeIcon icon={faPlus} className="cursor-pointer" />
        New Chat
      </Button>
      <div className="relative flex-auto">
        <div className="absolute inset-0 overflow-y-auto">
          <AnimatePresence>
            <div className="flex justify-between items-center">
              <div className="font-bold text-monoid-700 text-[10px] uppercase mb-2">
                Chat Sessions
              </div>
              {isFetching && (
                <PulseLoader
                  speedMultiplier={0.5}
                  color="#8E7B89"
                  size="8px"
                  className="-mt-1"
                />
              )}
            </div>
            {chatSessions
              .sort(( a, b ) =>
                isBefore( parseISO( a.updatedAt ), parseISO( b.updatedAt )) ? 1 : -1,
              )
              .filter( x => !deletedActionIds.includes( x.chatSessionUuid ))
              .map( session => (
                <div
                  key={session.chatSessionUuid}
                  className={clsx(
                    !isSessionSwitcherEnabled &&
                      'opacity-50 pointer-events-none cursor-not-allowed',
                  )}
                >
                  <motion.div
                    key={session.chatSessionUuid}
                    className={clsx(
                      'flex justify-between items-center rounded hover:bg-monoid-300 font-medium py-[6px] px-[10px] text-monoid-900 text-[17px]',
                      {
                        'bg-monoid-300': session.chatSessionUuid === sessionId,
                      },
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Link
                      to={generateLink( session.chatSessionUuid )}
                      key={session.chatSessionUuid}
                      className="w-full"
                    >
                      <div className="w-full">{session.title}</div>
                    </Link>
                    <FontAwesomeIcon
                      icon={faTrash}
                      className="pr-[2px] ml-[10px] cursor-pointer"
                      onClick={() => {
                        setDeletedActionIds( x =>
                          x.concat( session.chatSessionUuid ),
                        );
                        deleteSession({
                          projectId: Number( id ),
                          chatSessionUuid: String( session.chatSessionUuid ),
                        });
                        if ( sessionId === session.chatSessionUuid ) {
                          navigate( `/chat/${id}/new` );
                        }
                      }}
                    />
                  </motion.div>
                </div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
