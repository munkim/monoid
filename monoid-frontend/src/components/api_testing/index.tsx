import { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';

import Button from 'src/components/0100_button';
import CodeEditor from 'src/components/code_editor';
import { useMutation } from 'react-query';
import testAsApi, {
  TTestAsApiPayload,
  TTestAsApiResponse,
} from 'src/mutations/testAsApi';
import { useParams } from 'react-router-dom';
import ScaleLoader from 'react-spinners/ScaleLoader';
import clsx from 'clsx';

const APITesting: FC = () => {
  const { actionId } = useParams();
  const {
    data,
    mutate: test,
    isLoading,
    isSuccess,
  } = useMutation<TTestAsApiResponse, unknown, TTestAsApiPayload>( testAsApi );

  const disabled = isLoading || !actionId || actionId === 'new';

  return (
    <div className="mb-16">
      <Button
        className={clsx(
          'flex items-center justify-center gap-[10px] py-[8px] text-white bg-monoid-green-500 pl-[13px] pr-[13px] hover:border-monoid-green-500',
          disabled ? 'opacity-50' : 'opacity-100',
        )}
        disabled={disabled}
        onClick={() => !disabled && test({ actionId: Number( actionId ) })}
      >
        Test as API
        <FontAwesomeIcon icon={faPlay} />
      </Button>

      {/* <div className="mt-[16px]">
        <div className="flex gap-[10px]">
          {tabList.map( tab => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setCurrentTab( tab.id )}
              className={`px-[4px] py-[2px] bg-white font-bold text-15 ${
                currentTab === tab.id
                  ? 'border-b-[2px] border-b-monoid-900 text-monoid-900'
                  : 'text-monoid-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div> */}
      <div className="mt-4 font-semibold">Response</div>
      <div className="flex items-center font-bold gap-[15px] text-11 mb-2 text-monoid-900">
        {isLoading && (
          <>
            Awaiting response...
            <ScaleLoader color="#6D4D64" height={8} margin={1} width={2} />
          </>
        )}
        {isSuccess && (
          <>
            <p>
              <span>Status: </span>
              <span
                className={clsx(
                  Number( data.statusCode ) >= 400 && 'text-red-500',
                )}
              >
                {data.statusCode}
              </span>
            </p>
            <span>Time: {data.timeTaken}s</span>
            <span>Size: {data.responseSize}B</span>
          </>
        )}
      </div>
      <CodeEditor
        code={JSON.stringify( data?.response || {}, null, 2 )}
        readOnly
      />
    </div>
  );
};

export default APITesting;
