import { useQuery, useMutation } from 'react-query';
import createChatSession from 'src/mutations/createChatSession';
import getMessages, {
  TGetMessagesPayload,
  TGetMessagesResponse,
} from 'src/queries/getMessages';
import getAgent from 'src/queries/getAgent';
import getProjectChatConfig from 'src/queries/getProjectChatConfig';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import getCurrentAccount from 'src/queries/getCurrentAccount';
import getRequestHeader from 'src/utils/getRequestHeader';
import snakecaseKeys from 'snakecase-keys';
import { TAnnotatedActionCall } from 'src/components/0200_annotated_action_call/types';
import parseStreams from 'src/components/0200_annotated_action_call/utils/parseStreams';
import {
  TChatMessage,
  TSendMessagePayload,
  TCreateChatSessionResponse,
  TCreateChatSessionPayload,
  TAgentReadPayload,
  TAgentReadResponse,
  TAgentChatConfigReadPayload,
  TAgentChatConfigReadResponse,
  TAccountResponse,
} from '../types';

interface IProps {
  onCreateSession: () => void;
  onResponsePending: () => void;
  onResponseReceived: () => void;
}

const useChatWindow = ({
  onCreateSession,
  onResponsePending,
  onResponseReceived,
}: IProps ) => {
  const navigate = useNavigate();
  const location = useLocation();
  const xPathname = useMemo(() => location.pathname, [ location.pathname ]);
  const firstMessageRef = useRef<string | null>( null );
  const [ isResponsePending, setIsResponsePending ] = useState( false );
  const { id, sessionId } = useParams();
  const [ messages, setMessages ] = useState<TChatMessage[]>([]);
  const [ encodedAgentConfig, setEncodedAgentConfig ] = useState<string | null>(
    null,
  );

  const { data: account, isFetching: isFetchingAccount } = useQuery<
    unknown,
    unknown,
    TAccountResponse
  >({
    queryKey: [ 'account' ],
    queryFn: () => getCurrentAccount(),
  });

  const { data: persistedMessages, isFetching: isFetchingMessages } = useQuery<
    TGetMessagesPayload,
    unknown,
    TGetMessagesResponse
  >({
    queryKey: [ 'messages', id, sessionId ],
    queryFn: () =>
      getMessages({
        projectId: Number( id ),
        chatSessionId: sessionId || '',
      }),
    enabled: !!sessionId && sessionId !== 'new',
  });

  const send = useCallback(
    async ( payload: TSendMessagePayload ) => {
      setIsResponsePending( true );

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/chat-session/message-stream`,
        {
          method: 'POST',
          headers: {
            ...getRequestHeader(),
            'content-type': 'application/json',
          },
          body: JSON.stringify( snakecaseKeys( payload )),
        },
      );

      setIsResponsePending( false );

      // console.log( "response", response.ok, response.body )
      if ( response.ok && response.body ) {
        const createdAt = new Date().toISOString();
        // eslint-disable-next-line no-undef
        const stream = response.body
          // eslint-disable-next-line no-undef
          .pipeThrough( new TextDecoderStream())
          .getReader();

        let streamData: TAnnotatedActionCall[] = [];
        let hasAppended = false;

        window.history.replaceState( null, '', xPathname );
        onResponseReceived();

        // eslint-disable-next-line no-constant-condition
        while ( true ) {
          // eslint-disable-next-line no-await-in-loop
          const { done, value } = await stream.read();
          if ( done ) break;
          
          // console.log( value );
          
          const splitText = value.match( /.+}(?={)|.+/g ) ?? [];
          const subStreams: TAnnotatedActionCall[] = [];
          
          splitText.forEach( x => {
            try {
              // console.log( 'parsing: ', JSON.parse( x ));
              subStreams.push( JSON.parse( x ));
            } catch {
              console.log( 'error parsing: ', x );
            }
          });
          
          streamData = streamData.concat( ...subStreams );
          // console.log( "[ChatWindow/hooks/useChatWindow] stream value", streamData );
          const { actions, agentName } = parseStreams( streamData );
          // console.log( "[ChatWindow/hooks/useChatWindow] actions", actions );
          // console.log( "actions", actions );
          // setMessages( x => x.slice( 0, -1 ).concat(({ role:}));
          if ( hasAppended ) {
            setMessages( x =>
              x.slice( 0, -1 ).concat({
                // content: streamData.map( y => y.content ).join( '' ),
                content: '',
                annotatedActions: actions,
                createdAt,
                role: 'agent',
                messageAuthorName: agentName,
                messageAuthorType: "agent",
              }),
            );
          } else {
            hasAppended = true;
            setMessages( x =>
              x.concat({
                // content: streamData.map( y => y.content ).join( '' ),
                content: '',
                annotatedActions: actions,
                createdAt,
                role: 'agent',
                messageAuthorName: agentName,
                messageAuthorType: "agent",
              }),
            );
          }
          // setResponseData( streamData );
        }
      }
    },
    [ onResponseReceived, xPathname ],
  );

  // const { mutate: send, isLoading: isResponsePending } = useMutation<
  //   TChatMessage,
  //   unknown,
  //   TSendMessagePayload
  // >( sendMessage, {
  //   onMutate() {
  //     onResponsePending();
  //   },
  //   onSuccess( data ) {
  //     onResponseReceived();
  //     setMessages( x => x.concat( data ));
  //     window.history.replaceState( null, '', location.pathname );
  //   },
  //   onError() {
  //     onResponseReceived();
  //   },
  // });

  const { mutate: createSession } = useMutation<
    TCreateChatSessionResponse,
    unknown,
    TCreateChatSessionPayload
  >( createChatSession, {
    onSuccess( data ) {
      const { chatSessionUuid } = data;
      onCreateSession();

      navigate( `/chat/${id}/${chatSessionUuid}?p=${firstMessageRef.current}` );
    },
  });

  const { data: agentBasic, isFetching: isFetchingAgentBasic } = useQuery<
    TAgentReadPayload,
    unknown,
    TAgentReadResponse
  >({
    queryKey: [ 'agent', id ],
    queryFn: () => getAgent({ id: Number( id ) }),
    enabled: Number( id || 0 ) > 0,
  });

  const { data: projectChatConfig, isFetching: isFetchingProjectChatConfig } =
    useQuery<
      TAgentChatConfigReadPayload,
      unknown,
      TAgentChatConfigReadResponse
    >({
      queryKey: [ 'projectChatConfig', agentBasic?.slug ],
      queryFn: () =>
        getProjectChatConfig({
          slug: agentBasic?.slug || '',
          subdomain: agentBasic?.subdomain || '',
        }),
      enabled: !!agentBasic?.slug && !!agentBasic.subdomain,
    });

  useEffect(() => {
    if ( isResponsePending ) {
      onResponsePending();
    }
  }, [ isResponsePending, onResponsePending ]);

  return {
    createSession,
    encodedAgentConfig,
    firstMessageRef,
    isResponsePending,
    messages,
    persistedMessages,
    agentBasic,
    projectChatConfig,
    send,
    account,
    isFetchingAccount,
    isFetchingMessages,
    isFetchingAgentBasic,
    isFetchingProjectChatConfig,
    setEncodedAgentConfig,
    setMessages,
  };
};

export default useChatWindow;
