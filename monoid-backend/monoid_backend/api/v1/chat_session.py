import json
from typing import Any, List, Tuple, Dict
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status
from fastapi.responses import StreamingResponse
import tiktoken

from monoid_backend.api import helpers
from monoid_backend.api.v1.api_models.status_message import StatusMessage
from monoid_backend.crud.chat_session_crud import ChatSessionCRUD, get_chat_session_crud
from monoid_backend.crud.agent_crud import AgentCRUD, get_agent_crud
from monoid_backend.db_models.account import Account
from monoid_backend.monoid.action.action_config_model import AgentConfig
from monoid_backend.api.v1.api_models.chat_session import (
    ChatSessionCreateRequest,
    ChatSessionMessageRequest,
    ScheduledMessageRequest,
    ChatSessionMessageResponse,
    ChatSessionHeader,
    ChatSessionListReadResponse,
    ChatSessionMessagesReadResponse
)
from monoid_backend.monoid.agent import react_agent
from monoid_backend.monoid.agent.openai_utils import convert_monoid_message_to_openai_message

tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")

router = APIRouter()



@router.post(
    "",
    response_model=ChatSessionHeader,
    status_code=http_status.HTTP_201_CREATED,
    description="Create a session"
)
async def create_new_chat_session(
    data: ChatSessionCreateRequest,
    chatSessionCRUD: ChatSessionCRUD = Depends(get_chat_session_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ChatSessionHeader:
    chat_session_uuid, created_at, updated_at = await chatSessionCRUD.create(
        account_uuid=current_account.uuid,
        data=data
    )

    session = ChatSessionHeader(
        chat_session_uuid=chat_session_uuid,
        title=data.title,
        updated_at=updated_at
    )
    
    return session



@router.post(
    "/message-stream",
    status_code=http_status.HTTP_201_CREATED,
    description="Chat with an agent in a stream mode"
)
async def chat_with_an_agent(
    data: ChatSessionMessageRequest,
    chatSessionCRUD: ChatSessionCRUD = Depends(get_chat_session_crud),
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> StreamingResponse:
    # Check if chat session exists
    chat_session = await chatSessionCRUD.get(
        account_uuid=current_account.uuid,
        agent_id=data.agent_id,
        chat_session_uuid=data.chat_session_uuid
    )
    if not chat_session:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Chat Session with uuid {data.chat_session_uuid}"
        )

    agent = await agentCRUD.get(agent_id=data.agent_id)

    # Get all previous messages
    previous_messages = await chatSessionCRUD.get_messages_by_chat_session_uuid(chat_session_uuid=data.chat_session_uuid)

    # Get agent's response
    if data.encoded_agent_config:
        _agent_config = helpers.decode_json(data.encoded_agent_config)
        agent_name = _agent_config["agent_name"]
        agent_description = _agent_config["agent_description"]
        # TODO: Remove this agent_name type check hack
        # This was introduced because I didn't sleep enough and introduced a bug where agent_name/agent_description became a tuple randomly.
        _agent_config["agent_name"] = _agent_config["agent_name"] if type(agent_name) == str else agent_name[0]
        _agent_config["agent_description"] = _agent_config["agent_description"] if type(agent_description) == str else agent_description[0]
        agent_config = AgentConfig.model_validate(_agent_config)
    else:
        agent_config = AgentConfig(
            agent_name="Monoid",
            agent_description="You are an AI Agent powered by Monoid.",
            agent_type="ReAct Agent",
            all_action_configs={}
        )
    
    # Load all previous messages
    all_messages = []
    all_messages_lengths = []
    for message in previous_messages:
        if message.message_type == "expert_agent_language_response" and message.content:
            # Get the last language response of the first expert agent
            # and use it as a function response, so that the root agent can
            # answer its own function calling.
            openai_message = {
                "role": "function",
                "name": message.message_author_name,
                "content": message.content
            }
        elif message.nesting_level and message.nesting_level >= 0:
            continue
        else:
            openai_message = convert_monoid_message_to_openai_message(message)

        if openai_message != {}:
            all_messages.append(openai_message)
            all_messages_lengths.append(message.content_length)

    # If no previous messages, add system message (description of the agent)
    if all_messages == []:
        system_message_content = agent_config.agent_description + "\n\n"
        system_message_content += "You are also a helpful assistant that can leverage APIs to help users. "
        system_message_content += "You will have an ability to perform actions by leveraging APIs. "
        system_message_content += "For each action, you will need to decide the values of the parameters. "
        system_message_content += "If any parameters are missing, please ask the user for the input. "
        system_message_length = len(tokenizer.encode(system_message_content))

        _, created_at = await chatSessionCRUD.write_message(
            message_type="system",
            content=system_message_content,
            content_length=system_message_length,
            account_uuid=current_account.uuid,
            agent_id=data.agent_id,
            chat_session_uuid=data.chat_session_uuid,
            message_author_type="agent",
            message_author_name=agent_name,
            update_session=True,
        )

        all_messages.append({
            "role": "system",
            "content": system_message_content
        })
        all_messages_lengths.append(system_message_length)

    # Write user's message and include it in the input to the agent
    latest_user_message_length = len(tokenizer.encode(data.content))
    _, created_at = await chatSessionCRUD.write_message(
        message_type="user",
        content=data.content,
        content_length=latest_user_message_length,
        account_uuid=current_account.uuid,
        agent_id=data.agent_id,
        chat_session_uuid=data.chat_session_uuid,
        message_author_type="user",
        message_author_name=current_account.first_name,
        nesting_level=0,
        update_session=True,
    )

    latest_user_message = {
        "role": "user",
        "content": data.content
    }
    all_messages.append(latest_user_message)
    all_messages_lengths.append(latest_user_message_length)

    return StreamingResponse(
        react_agent.run_agent_stream(
            latest_user_message=latest_user_message,
            latest_user_message_length=latest_user_message_length,
            all_messages=all_messages,
            all_messages_lengths=all_messages_lengths,
            agent_name=agent.name,
            agent_config=agent_config,
            current_account=current_account,
            chatSessionCRUD=chatSessionCRUD,
            agentCRUD=agentCRUD,
            agent_id=data.agent_id,
            chat_session_uuid=data.chat_session_uuid
        ),
        media_type="text/event-stream"
    )


@router.get(
    "/list/{agent_id}",
    response_model=ChatSessionListReadResponse,
    status_code=http_status.HTTP_200_OK,
    description="Get a list of sessions that the current account created"
)
async def get_all_session_headers(
    agent_id: int,
    chatSessionCRUD: ChatSessionCRUD = Depends(get_chat_session_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ChatSessionListReadResponse:

    chat_sessions = await chatSessionCRUD.get_all_sessions(account_uuid=current_account.uuid, agent_id=agent_id)

    chat_session_list = ChatSessionListReadResponse(
        chat_sessions = [ChatSessionHeader(
            chat_session_uuid=session.chat_session_uuid,
            title=session.title if session.title else "",
            updated_at=session.updated_at
        ) for session in chat_sessions]
    )

    return chat_session_list


@router.get(
    "/{chat_session_uuid}",
    response_model=ChatSessionMessagesReadResponse,
    status_code=http_status.HTTP_200_OK,
    description="Get all messages from a session given chat_session_uuid"
)
async def get_session_messages_by_id(
    chat_session_uuid: UUID,
    agent_id: int,
    chatSessionCRUD: ChatSessionCRUD = Depends(get_chat_session_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ChatSessionMessagesReadResponse:

    session = await chatSessionCRUD.get(
        account_uuid=current_account.uuid, 
        agent_id=agent_id,
        chat_session_uuid=chat_session_uuid
    )

    if not session:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="The session does not exist"
        )

    if current_account.uuid != session.account_uuid:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to access this chat session"
        )
    
    chat_messages = await chatSessionCRUD.get_messages_by_chat_session_uuid(chat_session_uuid=chat_session_uuid)

    # Return all messages except the messages
    session_messages = ChatSessionMessagesReadResponse(
        session_messages=[
            # can be any of ["system", "user", "language_response", "action_call", "api_response"]
            ChatSessionMessageResponse(
                chat_session_uuid=chat_message.chat_session_uuid,
                created_at=chat_message.created_at,
                message_type=chat_message.message_type, 
                content=chat_message.content,
                action_name=chat_message.action_name,
                action_type=chat_message.action_type,
                message_author_type=chat_message.message_author_type,
                message_author_name=chat_message.message_author_name,
                nesting_level=chat_message.nesting_level
            ) for chat_message in chat_messages
        ]
    )

    return session_messages


@router.patch(
    "/{chat_session_uuid}",
    response_model=ChatSessionHeader,
    status_code=http_status.HTTP_200_OK,
    description="Change the title of the session given chat_session_uuid"
)
async def patch_session_by_id(
    chat_session_uuid: UUID,
    agent_id: int,
    title: str,
    chatSessionCRUD: ChatSessionCRUD = Depends(get_chat_session_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ChatSessionHeader:   
    title, updated_at = await chatSessionCRUD.update_title(
        chat_session_uuid=chat_session_uuid, 
        title=title, 
        account_uuid=current_account.uuid, 
        agent_id=agent_id
    )

    session_header = ChatSessionHeader(
        chat_session_uuid=chat_session_uuid,
        title=title,
        updated_at=updated_at
    )

    return session_header


@router.delete(
    "/{chat_session_uuid}",
    response_model=StatusMessage,
    status_code=http_status.HTTP_200_OK,
    description="Delete an session given chat_session_uuid"
)
async def delete_agent_by_id(
    chat_session_uuid: UUID,
    agent_id: int,
    chatSessionCRUD: ChatSessionCRUD = Depends(get_chat_session_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> StatusMessage:
    # Check if the session exists and that the current account is the owner of the session
    session = await chatSessionCRUD.get(
        account_uuid=current_account.uuid,
        agent_id=agent_id,
        chat_session_uuid=chat_session_uuid
    )

    if not session:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="The session does not exist"
        )

    if current_account.uuid != session.account_uuid:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to delete this chat session"
        )
    
    status = await chatSessionCRUD.delete_session(
        account_uuid=current_account.uuid, 
        agent_id=agent_id, 
        chat_session_uuid=chat_session_uuid
    )

    return {"status": status, "message": "The session has been deleted!"}
