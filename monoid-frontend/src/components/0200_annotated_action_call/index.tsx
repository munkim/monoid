import { FC, useEffect, useRef } from 'react';
import { TAnnotatedActionCall } from './types';
import AnnotatedAction from '../0100_annotated_action';
import parseStreams from './utils/parseStreams';

interface IProps {
  data: TAnnotatedActionCall[];
  isStreaming: boolean;
}

const AnnotatedActionCall: FC<IProps> = ({ data, isStreaming }) => {
  // const maxStep = data.length;
  const scrollerRef = useRef<HTMLDivElement>( null );
  // const [ step, setStep ] = useState( 0 );
  // const [ simulatedStreamingData, setSimulatedStreamingData ] = useState<
  //   TAnnotatedActionCall[]
  // >([]);

  // const { actions } = useParseStream( simulatedStreamingData );
  const { actions } = parseStreams( data );

  // useIntervalWhen(
  //   () => {
  //     setSimulatedStreamingData( data.slice( 0, step + 1 ));
  //     setStep( x => x + 1 );
  //   },
  //   25,
  //   step < maxStep,
  // );

  // console.log( "[AnnotatedActionCall] stream actions", actions );

  useEffect(() => {
    if ( isStreaming ) {
      scrollerRef.current?.scrollIntoView();
    }
  }, [ actions, isStreaming ]);

  return (
    <div>
      <div className="mt-4 font-semibold mb-2">Simulated Agent Response</div>
      {actions.map(( action, i ) => (
        <AnnotatedAction
          action={action}
          // eslint-disable-next-line react/no-array-index-key
          key={i}
        />
      ))}
      <div ref={scrollerRef} />
    </div>
  );
};

export default AnnotatedActionCall;
