import PulseLoader from 'react-spinners/PulseLoader';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useParams, useSearchParams } from 'react-router-dom';

import SendIcon from 'src/assets/message-send.svg';
import agentImage from 'src/assets/agent.svg';
import defaultProfileImage from 'src/assets/default-user.svg';
import clsx from 'clsx';
import Markdown from 'src/components/0100_markdown';
import AutoHeightTextarea from 'src/components/0100_auto_height_textarea';
import AnnotatedAction from 'src/components/0100_annotated_action';
import { IProps } from './types';
import useChatWindow from './hooks/useChatWindow';
import groupMessages from './utils/groupMessages';

const ChatWindow: FC<IProps> = ({
  onCreateSession,
  onResponsePending,
  onResponseReceived,
}) => {
  const { id, sessionId } = useParams();
  const [ searchParams ] = useSearchParams();
  const pParam = searchParams.get( 'p' );

  const [ query, setQuery ] = useState( '' );
  const endRef = useRef<HTMLDivElement>( null );

  const {
    firstMessageRef,
    createSession,
    send,
    persistedMessages,
    projectChatConfig,
    encodedAgentConfig,
    messages,
    setEncodedAgentConfig,
    setMessages,
    isResponsePending,
    account,
    isFetchingMessages,
  } = useChatWindow({ onCreateSession, onResponsePending, onResponseReceived });

  const onHandleMessageSend = useCallback(() => {
    if ( !encodedAgentConfig || isResponsePending ) return;

    if ( query.trim().length > 0 ) {
      setMessages( prevMessages =>
        prevMessages.concat({
          createdAt: new Date().toISOString(),
          content: query,
          role: 'user',
        }),
      );
      setQuery( '' );

      if ( !sessionId || sessionId === 'new' ) {
        firstMessageRef.current = query;
        createSession({
          projectId: Number( id ),
          title: query,
        });
      } else {
        send({
          agentId: Number( id ),
          chatSessionUuid: sessionId,
          content: query,
          encodedAgentConfig,
        });
      }
    }
  }, [
    createSession,
    encodedAgentConfig,
    firstMessageRef,
    id,
    send,
    sessionId,
    setMessages,
    query,
    isResponsePending,
  ]);

  const isChatEngineReady = useMemo(
    () => !!encodedAgentConfig,
    [ encodedAgentConfig ],
  );

  const handleContentChange = ( e: React.ChangeEvent<HTMLTextAreaElement> ) => {
    const { value } = e.target;
    setQuery( value );
  };

  const handleKeyUp = ( e: React.KeyboardEvent<HTMLTextAreaElement> ) => {
    if ( e.code === 'Enter' ) {
      e.preventDefault();
      // prevent send message when using input method enter
      if ( !e.shiftKey ) onHandleMessageSend();
    }
  };

  const handleKeyDown = ( e: React.KeyboardEvent<HTMLTextAreaElement> ) => {
    if ( e.code === 'Enter' && !e.shiftKey ) {
      setQuery( query.replace( /\n$/, '' ));
      e.preventDefault();
    }
  };

  // console.log( persistedMessages );
  // groupMessages( persistedMessages );
  // console.log( groupMessages( persistedMessages ));

  useEffect(() => {
    if ( endRef.current ) {
      endRef.current.scrollIntoView();
    }
  }, [ messages ]);

  useEffect(() => {
    if ( projectChatConfig?.encodedAgentConfig ) {
      setEncodedAgentConfig( projectChatConfig.encodedAgentConfig );
    }
  }, [ projectChatConfig, setEncodedAgentConfig ]);

  useEffect(() => {
    if ( !pParam ) {
      setMessages( groupMessages( persistedMessages ) || []);
    }
  }, [ pParam, persistedMessages, setMessages ]);

  useEffect(() => {
    if ( encodedAgentConfig && sessionId && pParam && pParam.trim().length > 0 ) {
      send({
        agentId: Number( id ),
        chatSessionUuid: sessionId,
        content: pParam,
        encodedAgentConfig,
      });
    }
  }, [ sessionId, pParam, send, id, encodedAgentConfig, isChatEngineReady ]);

  // console.log ( '[sockets/ChatWindow] messages', messages );

  return (
    <div className="flex flex-col h-full pb-[20px] lg:pb-[30px] bg-white">
      <div className="relative flex-auto">
        <div className="absolute inset-0 overflow-y-auto">
          <div className="items-stretch min-h-full">
            <AnimatePresence>
              {!pParam && isFetchingMessages && (
                <motion.div
                  className="w-full px-[50px] sm:px-[50px] md:px-[140px] lg:px-[80px] xl:px-[150px] 2xl:px-[300px] text-center flex justify-center"
                  initial={{ opacity: 0, y: 32, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 122 }}
                  exit={{ opacity: 0, y: -32, height: 0 }}
                >
                  <div className="border rounded-md my-8 p-4 flex items-center">
                    Fetching Chat History
                    <PulseLoader
                      speedMultiplier={0.5}
                      className="ml-4"
                      color="#8E7B89"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {messages.map( message =>  { return (
              <div
                key={message.createdAt}
                className="w-full"
                // initial={{ opacity: 0, y: 32 }}
                // animate={{ opacity: 1, y: 0 }}
              >
                {/* {message.createdAt} */}
                <div
                  className={clsx({
                    'bg-monoid-600': message.role === 'user',
                    'bg-white': message.role !== 'user',
                    'px-[50px] sm:px-[50px] md:px-[140px] lg:px-[80px] xl:px-[150px] 2xl:px-[300px]':
                      true,
                    'py-[22px]': message.role === 'user',
                    'py-[18px]': message.role !== 'user',
                    'w-full': true,
                  })}
                >
                  <div className="flex items-center justify-start gap-[10px] mb-4">
                    <img
                      src={
                        message.role === 'user'
                          ? defaultProfileImage
                          : agentImage
                      }
                      alt="user"
                      className="w-[40px] h-[40px]"
                    />
                    <p className="font-bold text-black">
                      {message.role === 'user'
                        ? `${account?.firstName ?? ''} ${
                            account?.lastName ?? ''
                          }`
                        : message.messageAuthorName}
                    </p>
                  </div>
                  {message.annotatedActions ? (
                    message.annotatedActions.map(( action, i ) => {
                      return (
                        // eslint-disable-next-line react/no-array-index-key
                        <AnnotatedAction action={action} key={i} />
                      )
                    })
                  ) : (
                    <div className="mt-7 whitespace-pre-wrap">
                      {Number( message.content.match( '```' )?.length || 0 ) > 0 ? (
                        <Markdown content={message.content} />
                      ) : (
                        <div>{message.content}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )})}
            {isResponsePending && (
              <motion.div
                className="flex mt-[10px] px-[50px] sm:px-[50px] md:px-[140px] lg:px-[80px] xl:px-[150px] 2xl:px-[300px]"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex px-6 py-4 mt-2 bg-white border rounded whitespace-pre-lines border-monoid-300">
                  <PulseLoader
                    speedMultiplier={0.5}
                    color="#6d4d64"
                    size="8px"
                  />
                </div>
              </motion.div>
            )}
            <div ref={endRef} className="h-[40px]" />
          </div>
        </div>
      </div>

      <div className="relative mx-[50px] sm:mx-[50px] md:mx-[140px] lg:mx-[80px] xl:mx-[150px] 2xl:mx-[300px]">
        <AutoHeightTextarea
          value={query}
          placeholder={
            isChatEngineReady
              ? 'Send a message...'
              : 'Chat Engine is initializing. Please wait...'
          }
          className="block w-full py-[10px] text-gray-700 border rounded-md shadow-md resize-none leading-[22px] pr-[80px] pl-[13px] focus:outline-none sm:text-sm bg-white"
          autoFocus
          onChange={handleContentChange}
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute flex items-center top-[11px] right-[15px]">
          <span className="mr-[10px] text-sm text-monoid-700">
            {query.trim().length}
          </span>
          <button type="button" onClick={onHandleMessageSend}>
            <img
              src={SendIcon}
              alt="send"
              className={clsx( 'cursor-pointer opacity-50', {
                'brightness-75 saturate-200 opacity-100':
                  isChatEngineReady && query.trim().length > 0,
              })}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
