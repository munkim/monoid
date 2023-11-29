import { TParsedAction } from 'src/components/0200_annotated_action_call/utils/parseStreams';
import { TGetMessagesResponse } from 'src/queries/getMessages';
import { TRole, TChatMessage } from '../types';

const groupMessages = ( messages = [] as TGetMessagesResponse ) => {
  const visibleMessages = messages.filter( x => x.role !== 'system' );
  let groupedMessages: TChatMessage[] = [];
  let annotatedActions: TParsedAction[] = [];
  let annotatedAction: TParsedAction = {};

  // Group consecutive action-related messages into a single message for display:
  // action_call (arguments), api_response, 
  // let annotatedAction: TParsedAction = {};
  // console.log( "[groupMessages] visibleMessages: ", visibleMessages );

  const num_messages = visibleMessages.length;
  visibleMessages.forEach( (message, index) => {
    let groupedMsg: TChatMessage;
    if ( message.messageAuthorType === 'agent' ) {
      // Group action_call and api_response messages into a single message
      // Other messages are added to groupedMessages as-is
      switch ( message.role ) {
        case 'action_call':
          annotatedAction.actionName = String( message.actionName );
          annotatedAction.actionArguments = message.content;
          annotatedAction.nestingLevel = message.nestingLevel;
          annotatedAction.messageAuthorName = message.messageAuthorName;
          annotatedAction.messageAuthorType = message.messageAuthorType;
          break;
          
        case "api_response":
          annotatedAction.apiResponse = JSON.parse( message.content );
          // Parse one more time since 'response' is stringified twice
          if (annotatedAction.apiResponse) {
            annotatedAction.apiResponse.response = annotatedAction.apiResponse.response;
          };
          break;

        // if not any of the above, add it to AnnotatedAction and push to groupedMessages
        default:
          if ( annotatedAction.actionName ) {
            // console.log( "[groupMessages] annotatedAction: ", annotatedAction );
            annotatedActions = annotatedActions.concat( annotatedAction );
          }
          annotatedActions = annotatedActions.concat( message as TParsedAction ); // TODO: polish this up
          annotatedAction = {};
          break;
        };
      }
    // console.log( "[groupMessages] index: ", index );

    // If the message author type is a user,
    // if the message is the last in the list,
    // or if the message is a language_response (the last message) from an agent,
    // then add latest group message to groupedMessages
    if ( message.messageAuthorType === 'user' ||
      (
        message.messageAuthorType === 'agent' &&
        message.role === 'language_response'
      ) ||
      (
        message.messageAuthorType === 'agent' &&
        index == num_messages - 1
      )
    ) {
      groupedMsg = {
        content: message.content,
        role: message.messageAuthorType as TRole,
        createdAt: String( message.createdAt ),
        messageAuthorName: message.messageAuthorName,
        messageAuthorType: message.messageAuthorType,
      }
      if ( annotatedActions.length > 0 ) {
        groupedMsg.annotatedActions = annotatedActions;
      }
      groupedMessages = groupedMessages.concat(groupedMsg)
      annotatedActions = [];
    }
  });

  return groupedMessages;
};

export default groupMessages;
