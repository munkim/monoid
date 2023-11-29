import { TAnnotatedActionCall, TApiResponse } from '../types';

export type TParsedAction = {
  actionName?: string;
  actionArguments?: string;
  actionType?: string;
  apiResponse?: TApiResponse['content'];
  agentName?: string;
  expertAgentName?: string;
  expertAgentId?: number;
  languageResponse?: string;
  expertAgentLanguageResponse?: string;
  timeElapsed?: number;
  isStreamingActionCall?: boolean;
  nestingLevel?: number;
  messageAuthorName?: string;
  messageAuthorType?: string;
  role?: string; // TODO: replace with type
  content?: string;
};

const parseStreams = ( stream: TAnnotatedActionCall[]) => {
  const actions: TParsedAction[] = [];
  let actionAppended = false;
  let annotatedAction: TParsedAction = {};
  let agentName: string = "";
  let isApiAction = false;

  stream.forEach( x => {
    const entryType = x.type;
    actionAppended = false;
    agentName = x.agent_name as string;

    // If action_call
    switch ( entryType ) {
      case 'action_call':
        // console.log( "[parseStreams] action_call", x.content );
        if ( !annotatedAction.actionName ) {
            annotatedAction.actionName = x.content.name;
            annotatedAction.actionArguments = x.content.arguments;
        } else {
            annotatedAction.actionArguments += x.content.arguments;
        };
        annotatedAction.nestingLevel = x.nesting_level;
        annotatedAction.role = 'action_call';
        annotatedAction.messageAuthorName = x.agent_name;
        annotatedAction.messageAuthorType = "agent";
        annotatedAction.nestingLevel = x.nesting_level;
        annotatedAction.actionType = x.content.action_type;
        if ( x.content.action_type === 'api' ) {
          isApiAction = true;
        }
        break;
      case 'api_response':
        // console.log( "[parseStreams] api_response", x.content );
        annotatedAction.apiResponse = {
          ...x.content,
          // response: JSON.parse( x.content.response ),
        };
        actions.push( annotatedAction );
        actionAppended = true;
        annotatedAction = {};
        isApiAction = false;
        break;
      case 'language_response':
        // console.log( "[parseStreams] language_response", x.content );
        if ( !annotatedAction.content ) {
          annotatedAction.content = x.content;
        } else {
          annotatedAction.content += x.content;
        }
        annotatedAction.role = 'language_response';
        annotatedAction.messageAuthorName = x.agent_name;
        annotatedAction.messageAuthorType = "agent";
        annotatedAction.nestingLevel = x.nesting_level;
        break;
      case 'expert_agent_call_start':
        annotatedAction = {
          expertAgentName: x.content.expert_agent_name,
          expertAgentId: x.content.expert_agent_id,
          role: 'expert_agent_call_start',
          nestingLevel: x.nesting_level
        };
        // console.log( "[parseStreams] expert_agent_call_start", annotatedAction );
        actions.push( annotatedAction );
        actionAppended = true;
        annotatedAction = {};
        break;
      case 'expert_agent_language_response':
        if ( !annotatedAction.content ) {
          annotatedAction.content = x.content;
        } else {
          annotatedAction.content += x.content;
        }
        annotatedAction.role = 'expert_agent_language_response';
        annotatedAction.messageAuthorName = x.agent_name;
        annotatedAction.messageAuthorType = "agent";
        annotatedAction.nestingLevel = x.nesting_level;
        break;
      case 'time_elapsed':
        annotatedAction.timeElapsed = Number( x.content );
        // console.log( "[parseStreams] time_elapsed", annotatedAction );
        actions.push( annotatedAction );
        actionAppended = true;
        annotatedAction = {};
        break;
      case 'stop':
        if ( !isApiAction ) {
          // console.log( "[parseStreams] stop", annotatedAction );
          actions.push( annotatedAction );
          actionAppended = true;
          annotatedAction = {};
          break;
        }
    }
  });

  if ( !actionAppended ) {
    // console.log( "[parseStreams] !actionAppended", annotatedAction );
    actions.push( annotatedAction );
  }

  // console.log( actions[0].languageResponse );

  return {
    actions,
    agentName
  };
};

export default parseStreams;
