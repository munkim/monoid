import { FC, useState } from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { httpMethodListMap } from 'src/utils/constants';
import { TParsedAction } from '../0200_annotated_action_call/utils/parseStreams';

interface IProps {
  action: TParsedAction;
}

const AnnotatedAction: FC<IProps> = ({ action }) => {
  const [ isExpanded, setIsExpanded ] = useState( false );

  return (
    <div
      key="routine"
      className="grid gap-y-4 mb-4"
      style={{ paddingLeft: `${( action.nestingLevel || 0 ) * 32}px` }}
    >
      {( action.actionName ) && (
        <div className="border border-monoid-900 bg-monoid-100 p-2 shadow-lg rounded-md">
          <button
            type="button"
            className="flex justify-between items-center w-full"
            onClick={() => setIsExpanded( x => !x )}
          >
            <div className="flex items-center">
              {action.actionName && <b>Action:</b>}
              {/* {action.expertAgentName && <b>Expert Agent:</b>} */}
              <div className="ml-2 font-mono text-xs bg-monoid-300 p-1 px-2 rounded-md">
                {action.actionName}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {action.isStreamingActionCall && (
                <ScaleLoader color="#6D4D64" height={16} margin={1} />
              )}
              <FontAwesomeIcon
                icon={faChevronDown}
                className={clsx(
                  'cursor-pointer fa-fw transition-all duration-300 -mt-0.5',
                  isExpanded && 'transform rotate-180',
                )}
              />
            </div>
          </button>
          {isExpanded && <div
            className={clsx(
              'overflow-auto transition-all duration-500',
              isExpanded ? 'max-h-[2048px]' : 'max-h-0',
            )}
          >
            {action.actionArguments && (
              <div>
                <b>Arguments:</b>
                <div className="font-mono text-xs whitespace-pre-wrap bg-monoid-100 p-2">
                  {action.actionArguments}
                </div>
              </div>
            )}
            {action.apiResponse && (
              <div className="border-t border-monoid-700 pt-2 mt-2">
                {action.apiResponse.url && (
                  <div className="flex items-end gap-2">
                    <div
                      className={clsx(
                        httpMethodListMap.find(
                          x => x.value === action.apiResponse?.method,
                        )?.className,
                      )}
                    >
                      {action.apiResponse.method}
                    </div>
                    <div className="text-sm overflow-hidden">
                      {action.apiResponse.url}
                    </div>
                  </div>
                )}
                {action.apiResponse.query_parameters && (
                  <div>
                    <b>Query Parameters:</b>
                    <div className="font-mono text-xs whitespace-pre-wrap bg-monoid-100 p-2">
                      {JSON.stringify(
                        action.apiResponse.query_parameters,
                        null,
                        2,
                      )}
                    </div>
                  </div>
                )}
                {action.apiResponse.body && (
                  <div>
                    <b>Body:</b>
                    <div className="font-mono text-xs whitespace-pre-wrap bg-monoid-100 p-2">
                      {JSON.stringify( action.apiResponse.body, null, 2 )}
                    </div>
                  </div>
                )}
                {action.apiResponse.response && (
                  <div>
                    <b>Response:</b>
                    <div className="font-mono text-xs whitespace-pre-wrap bg-monoid-100 p-2">
                      { JSON.stringify( action.apiResponse.response, null, 2 ) }
                    </div>
                  </div>
                )}
                <div className="text-xs border-t border-monoid-300 pt-1 text-monoid-700 space-x-2">
                  <span>
                    <span>Status: </span>
                    <span
                      className={clsx(
                        Number( action.apiResponse.status_code ) == 200 && 'text-green-500',
                        Number( action.apiResponse.status_code ) >= 400 && 'text-red-500',
                        )}
                        >
                      {action.apiResponse.status_code}
                    </span>
                  </span>
                  <span>
                    Time: <b>{action.apiResponse.time_elapsed}</b>s
                  </span>
                </div>
              </div>
            )}
          </div>}
        </div>
      )}
      {action.role == "expert_agent_call_start" && (
        <div className="border-b border-monoid-900 ">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <b>Asking an expert agent</b>
            </div>
            <div>
              {action.isStreamingActionCall && (
                <ScaleLoader color="#6D4D64" height={16} margin={1} />
              )}
            </div>
          </div>
        </div>
      )}
      {action.role === "expert_agent_language_response" && (
        <div className="border border-monoid-900 bg-monoid-100 p-2 shadow-lg rounded-md">
          <button
            type="button"
            className="flex justify-between items-center w-full"
            onClick={() => setIsExpanded( x => !x )}
          >
            <div className="flex items-center">
              <b>Expert Agent Response</b>
            </div>
            <div className="flex justify-end gap-2">
              {action.isStreamingActionCall && (
                <ScaleLoader color="#6D4D64" height={16} margin={1} />
              )}
              <FontAwesomeIcon
                icon={faChevronDown}
                className={clsx(
                  'cursor-pointer fa-fw transition-all duration-300 -mt-0.5',
                  isExpanded && 'transform rotate-180',
                )}
              />
            </div>
          </button>
          {isExpanded && <div
            className={clsx(
              'overflow-auto transition-all duration-500',
              isExpanded ? 'max-h-[2048px]' : 'max-h-0',
            )}
          >
            <div className="w-full grid gap-y-1">
              <div className="w-full whitespace-pre-wrap">
                {action.content}
              </div>
              {action.timeElapsed && (
                <div className="text-xs border-t border-monoid-300 pt-1 text-monoid-700">
                  Time: <b>{action.timeElapsed}</b>s
                </div>
              )}
            </div>
          </div>}
        </div>
      )}


      {action.role === "language_response" && (
        <div className="w-full grid gap-y-1">
          <div className="w-full whitespace-pre-wrap">
            {action.content}
          </div>
          {action.timeElapsed && (
            <div className="text-xs border-t border-monoid-300 pt-1 text-monoid-700">
              Time: <b>{action.timeElapsed}</b>s
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnnotatedAction;
