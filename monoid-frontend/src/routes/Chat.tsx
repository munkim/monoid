import { FC, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';

import ChatSidebar from 'src/sockets/ChatSidebar';
import ChatWindow from 'src/sockets/ChatWindow';

import getChatSessions from 'src/queries/getChatSessions';
import clsx from 'clsx';
import ChatHeader from 'src/components/0100_chat_header';
import getAgent from 'src/queries/getAgent';
import {
  TAgentReadPayload,
  TAgentReadResponse,
} from 'src/sockets/ChatWindow/types';

type TChatSessionListPayload = {
  id: number;
};

type TChatSessionListResponse = {
  chatSessionUuid: string;
  title: string;
  updatedAt: string;
}[];

const Chat: FC = () => {
  const { id } = useParams();
  const {
    data: chatSessions,
    isFetching,
    refetch,
  } = useQuery<TChatSessionListPayload, null, TChatSessionListResponse>({
    queryKey: [ 'chatSessions', id ],
    queryFn: () => getChatSessions({ id: Number( id ) }),
    enabled: Number( id || 0 ) > 0,
  });
  const [ isSessionSwitcherEnabled, setIsSessionSwitcherEnabled ] =
    useState( true );

  const { data: agentInfo } = useQuery<
    TAgentReadPayload,
    unknown,
    TAgentReadResponse
  >({
    queryKey: [ 'agent', id ],
    queryFn: () => getAgent({ id: Number( id ) }),
    enabled: Number( id || 0 ) > 0,
  });
  const [ menuOpen, setMenuOpen ] = useState<boolean>( false );
  const excludedElementRef = useRef( null );

  const enableSessionSwitcher = useCallback(() => {
    setIsSessionSwitcherEnabled( true );
  }, []);

  const disableSessionSwitcher = useCallback(() => {
    setIsSessionSwitcherEnabled( false );
  }, []);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        menuOpen={menuOpen}
        agentInfo={agentInfo}
        setMenuOpen={setMenuOpen}
        ref={excludedElementRef}
        chatSessions={chatSessions || []}
      />
      <div className="flex flex-1">
        <div
          className={clsx(
            'border border-t-0 bg-transparent border-monoid-300',
            {
              'block z-40 h-full fixed lg:relative top-[50px] lg:top-0 left-0':
                menuOpen,
            },
            { 'hidden lg:block': !menuOpen },
          )}
        >
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ x: -300 }} // initial position of the sidebar
                animate={{ x: 0 }} // animate to the final position (in this case, 0)
                exit={{ x: -300 }} // animate back to the initial position when closing
                transition={{ duration: 0.3 }}
                className="h-full bg-monoid-100"
              >
                <ChatSidebar
                  chatSessions={chatSessions || []}
                  isFetching={isFetching}
                  isSessionSwitcherEnabled={isSessionSwitcherEnabled}
                  menuOpen={menuOpen}
                  setMenuOpen={setMenuOpen}
                  excludedElementRef={excludedElementRef}
                />
              </motion.div>
            )}
            {!menuOpen && (
              <ChatSidebar
                chatSessions={chatSessions || []}
                isFetching={isFetching}
                isSessionSwitcherEnabled={isSessionSwitcherEnabled}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                excludedElementRef={excludedElementRef}
              />
            )}
          </AnimatePresence>
        </div>
        <div className="relative w-full">
          <ChatWindow
            onCreateSession={refetch}
            onResponsePending={disableSessionSwitcher}
            onResponseReceived={enableSessionSwitcher}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
