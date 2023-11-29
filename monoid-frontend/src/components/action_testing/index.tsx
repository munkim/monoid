import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FC, useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import clsx from 'clsx';
import getRequestHeader from 'src/utils/getRequestHeader';
import snakecaseKeys from 'snakecase-keys';
import ScaleLoader from 'react-spinners/ScaleLoader';
import TextArea from '../0100_textarea';
import Button from '../0100_button';
import AnnotatedActionCall from '../0200_annotated_action_call';
import { TAnnotatedActionCall } from '../0200_annotated_action_call/types';
// import testData from '../0200_annotated_action_call/testData';
import testDataExpert from '../0200_annotated_action_call/testDataExpert';

const isTestMode = false;

const ActionTesting: FC = () => {
  const { actionId } = useParams();
  const [ error, setError ] = useState<string | null>( null );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ isStreaming, setIsStreaming ] = useState( false );
  const [ responseData, setResponseData ] = useState<
    TAnnotatedActionCall[] | null
  >( null );
  const { register, watch } = useForm({
    defaultValues: {
      input: '',
    },
  });
  const actualResponseData = isTestMode ? testDataExpert : responseData;

  const test = useCallback(
    async ({
      actionId,
      userMessage,
    }: {
      actionId: number;
      userMessage: string;
    }) => {
      setResponseData( null );
      setIsLoading( true );
      setIsStreaming( false );
      setError( null );

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api-action/action-test-stream`,
        {
          method: 'POST',
          headers: {
            ...getRequestHeader(),
            'content-type': 'application/json',
          },
          body: JSON.stringify( snakecaseKeys({ actionId, userMessage })),
        },
      );

      if ( response.ok && response.body ) {
        setIsStreaming( true );
        const stream = response.body
          // eslint-disable-next-line no-undef
          .pipeThrough( new TextDecoderStream())
          .getReader();

        let streamData: TAnnotatedActionCall[] = [];

        // eslint-disable-next-line no-constant-condition
        while ( true ) {
          // eslint-disable-next-line no-await-in-loop
          const { done, value } = await stream.read();
          if ( done ) break;

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
          setResponseData( streamData );
          // setResponseData( streamData.concat( subStreams ));
        }

        setIsLoading( false );
        setIsStreaming( false );
      } else {
        setError( await response.text());
        setIsLoading( false );
        setIsStreaming( false );
      }
    },
    [],
  );

  const isValid = watch( 'input' ).trim().length > 0;
  const disabled = !isValid || isLoading || !actionId || actionId === 'new';
  const friendlyError = useMemo(() => {
    if ( !error ) return null;

    try {
      return JSON.stringify( JSON.parse( error ), null, 2 );
    } catch {
      return error;
    }
  }, [ error ]);

  return (
    <div>
      <Button
        className={clsx(
          'flex items-center justify-center gap-[10px] py-[8px] text-white bg-monoid-green-500 pl-[13px] pr-[13px] hover:border-monoid-green-500',
          disabled ? 'opacity-50' : 'opacity-100',
        )}
        disabled={disabled}
        onClick={() =>
          !disabled &&
          test({ actionId: Number( actionId ), userMessage: watch( 'input' ) })
        }
      >
        Test with Simulated Agent
        <FontAwesomeIcon icon={faPlay} />
      </Button>

      <div className="mt-4 font-semibold mb-2">User Message</div>
      <TextArea
        {...register( 'input', { minLength: 1 })}
        className="w-full"
        onKeyDown={e => {
          if ( e.code === 'Enter' && ( e.ctrlKey || e.metaKey )) {
            e.preventDefault();
            test({ actionId: Number( actionId ), userMessage: watch( 'input' ) });
          }
        }}
      />

      {( isLoading || isStreaming ) && (
        <div className="flex items-center gap-2">
          {isStreaming ? 'Streaming response' : 'Awaiting response'}

          <ScaleLoader color="#6D4D64" height={16} margin={1} />
        </div>
      )}
      {friendlyError && (
        <div>
          Error streaming response:
          <div className="text-red-500 font-mono whitespace-pre-wrap text-xs  p-4 border border-l-4 border-monoid-300">
            {friendlyError}
          </div>
        </div>
      )}
      {actualResponseData && (
        <AnnotatedActionCall
          data={actualResponseData}
          isStreaming={isLoading}
        />
      )}
    </div>
  );
};

export default ActionTesting;
