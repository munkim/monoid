"""
- parse function name
- resolve api function (if params don't match then tell gpt to retry)
- call external api

Should we implement all of the individual apis? 
How do we handle the different apis more effectively in one place?

"""
import re
import json
import time
import openai
from typing import Any, List, Tuple, Dict
from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status

import httpx
import asyncio
import tiktoken

from monoid_backend.config import settings
from monoid_backend.monoid.action.utils import call_api, openai_function_call
from monoid_backend.db_models.account import Account
from monoid_backend.db_models.agent import Agent
from monoid_backend.crud.chat_session_crud import ChatSessionCRUD
from monoid_backend.crud.agent_crud import AgentCRUD
from monoid_backend.monoid.action.action_config_model import (
    FunctionCallConfig,
    FunctionCallKeysToPaths,
    FunctionCallConfig,
    APIConfig,
    AgentConfig,
    FunctionCallConfig,
    NestedParameter
)

tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")


async def run_agent_stream(
    latest_user_message: Dict[str, Any],
    latest_user_message_length: int,
    all_messages: List[Dict[str, Any]],
    all_messages_lengths: List[int],
    agent_name: str,
    agent_config: AgentConfig, # AgentConfig in JSON, not an object
    chatSessionCRUD: ChatSessionCRUD,
    agentCRUD: AgentCRUD,
    current_account: Account,
    agent_id: int,
    chat_session_uuid: str,
    max_token_length: int = 4000,
    is_running_expert_agent: bool = False,
    nesting_level: int = 0,
    llm_api_key: str = None,
):
    if nesting_level == 3 and is_running_expert_agent:
        nesting_cutoff_message = "Sorry, I am not able to assist due to a system issue."
        all_messages += [{
            "role": "function",
            "name": agent_name,
            "content": nesting_cutoff_message
        }]
        _, created_at = await chatSessionCRUD.write_message(
            message_type="language_response",
            content=agent_full_response,
            content_length=agent_full_response_length,
            account_uuid=current_account.uuid,
            agent_id=agent_id,
            chat_session_uuid=chat_session_uuid,
            message_author_type="agent",
            message_author_name=agent_name,
            nesting_level=nesting_level,
            update_session=True,
        )
        return 
    
    # Construct a dictionary containing all configs
    all_api_configs = {}
    all_function_call_keys_to_paths = {}
    all_followup_prompts = {}
    all_function_call_configs = []
    expert_agent_name_to_id = {}
    action_name_to_action_type = {}
    llm_vendor_and_model = agent_config.llm_option.resolve()
    llm_api_key = agent_config.llm_api_key if not llm_api_key else llm_api_key

    # If Agent has any action configured, populate all 
    if agent_config is not None: # TODO: Remove this check because agent_config will always exist now
        all_action_configs = agent_config.all_action_configs
        print("\n============================================================")
        print(f"[DEBUG] Agent Config for {agent_name}")
        print(agent_config)
        print("============================================================\n")

        # Loop through all actions
        if all_action_configs is not None:
            for action_type, _action_configs in all_action_configs.root.items():
                for _, action_config in _action_configs.root.items():
                    if action_type == "api":
                        # Create a dictionary containing all API configs. Use functional call names as keys.
                        all_api_configs[action_config.function_call_config.name] = action_config.api_config
                        all_function_call_keys_to_paths[action_config.function_call_config.name] = action_config.function_call_keys_to_paths
                        all_followup_prompts[action_config.function_call_config.name] = action_config.followup_prompt

                        # If enum in a function call config is None, remove it
                        properties = action_config.function_call_config.parameters.properties.root
                        for property_name, property in properties.items():
                            if "enum" in property:
                                property.pop("enum")

                        all_function_call_configs.append(action_config.function_call_config)
                        action_name_to_action_type[action_config.function_call_config.name] = action_type.value

                    elif action_type == "expert_agent":
                        expert_agent_name_to_id[action_config.function_call_config.name] = action_config.expert_agent_config.expert_agent_id
                        all_function_call_configs.append(action_config.function_call_config)
                        action_name_to_action_type[action_config.function_call_config.name] = action_type.value
        
    # Only use last N messages that fills up to max_token_length requirements
    current_total_length = sum(all_messages_lengths)
    while current_total_length > max_token_length:
        popped_message = all_messages.pop(0)
        popped_message_length = all_messages_lengths.pop(0)
        current_total_length -= popped_message_length

        if all_messages == []:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"There is no message without surpassing the maximum token length, which is {max_token_length}."
            )

    # Initial OpenAI Call
    # TODO: Add timeout/retry to this call in case OpenAI is not responding + respond with a message to the user
    openai_response = await openai_function_call(
        all_messages, 
        all_function_call_configs,
        streaming=True,
        model_name=llm_vendor_and_model['model'],
        api_key=llm_api_key
    )

    action_start_time = time.time()
    while True:
        action_name = ""
        arguments_json = ""
        agent_full_response = ""
        arguments_json_length = 0
        agent_full_response_length = 0
        last_response_type = None

        # At the end of the loop, either action_name/arguments_json OR agent_full_response 
        # will be populated, but not both.
        async for chunk in openai_response:
            delta = chunk["choices"][0]["delta"]
            if delta == {}: # End of OpenAI's stream response
                yield json.dumps({
                    "type": "stop",
                    "last_response_type": last_response_type,
                    "agent_name": agent_name,
                    "nesting_level": nesting_level
                }) + '\n'  
            elif 'function_call' in delta:
                # TODO: Check an edge case when an action_name is super long
                action_name = delta["function_call"].get("name", action_name)
                action_type = action_name_to_action_type.get(action_name)
                arguments_json_delta = delta["function_call"]["arguments"]
                arguments_json += arguments_json_delta
                arguments_json_length += 1
                yield json.dumps({
                    "type": "action_call",
                    "content": {
                        "name": action_name,
                        "action_type": action_type,
                        "arguments": arguments_json_delta
                    },
                    "agent_name": agent_name,
                    "nesting_level": nesting_level
                }) + '\n'
                last_response_type = "action_call"

            # This would be the last OpenAI response
            elif 'content' in delta:
                text = delta['content']
                agent_full_response += text
                agent_full_response_length += 1
                if not is_running_expert_agent:
                    yield json.dumps({
                        "type": "language_response",
                        "content": text,
                        "agent_name": agent_name,
                        "nesting_level": nesting_level
                    }) + '\n'
                    last_response_type = "language_response"
                else:
                    yield json.dumps({
                        "type": "expert_agent_language_response",
                        "content": text,
                        "agent_name": agent_name,
                        "nesting_level": nesting_level
                    }) + '\n'
                    last_response_type = "expert_agent_language_response"
                
            else:
                if settings.MONOID_ENVIRONMENT == "local":
                    print("[DEBUG] Unknown delta type in a chunk:")
                    print(chunk)
                break

        # Make the Action Call given arguments_json.
        # If OpenAI response was about a function call,
        # then arguments_json would have been populated.
        # Note ethat arguments_json may be empty when an expert_agent is needed as action or when api_action don't have any params.
        if action_name != "" or arguments_json != "":
            if settings.MONOID_ENVIRONMENT == "local":
                print("\n============================================================")
                print(f"[DEBUG] {agent_name} is calling {action_name} as action.")
                print(f"Action Type: {action_name_to_action_type[action_name]}.")
                print("Argument JSON:")
                print(arguments_json)
                print("============================================================\n")

            all_messages_lengths += [arguments_json_length]
            current_total_length += arguments_json_length
            _, created_at = await chatSessionCRUD.write_message(
                message_type="action_call",
                content=arguments_json,
                content_length=arguments_json_length,
                account_uuid=current_account.uuid,
                agent_id=agent_id, # Root agent
                chat_session_uuid=chat_session_uuid,
                message_author_type="agent",
                message_author_name=agent_name,
                action_name=action_name,
                action_type=action_name_to_action_type[action_name],
                nesting_level=nesting_level,
                update_session=True,
            )

            if action_name_to_action_type[action_name] == "api":
                # Get the api_config and function_call_keys_to_paths for the action chosen by ChatGPT
                api_config = all_api_configs.get(action_name)
                function_call_keys_to_paths = all_function_call_keys_to_paths.get(action_name)

                # Make API action call
                api_start_time = time.time()
                method, url, query_parameters, body, api_response, api_status_code = await call_api(
                    api_config, 
                    function_call_keys_to_paths, 
                    json.loads(arguments_json)
                )

                if settings.MONOID_ENVIRONMENT == "local":
                    print("\n============================================================")
                    print(f"[DEBUG] {agent_name} -- {action_name}, API Call Context/Response:")
                    print(url)
                    print(query_parameters)
                    print(body)
                    print(api_response)
                    print(api_status_code)
                    print("============================================================\n")

                api_end_time = time.time()
                api_response_json = json.dumps(api_response)

                # Add the API response and followup prompt to the message history
                all_messages.append({
                    "role": "function",
                    "name": action_name,
                    "content": api_response_json
                })

                api_context = {
                    "name": action_name,
                    "method": method,
                    "url": url,
                    "query_parameters": query_parameters,
                    "body": body,
                    "response": api_response,
                    "time_elapsed": round(api_end_time - api_start_time, 2),
                    "status_code": api_status_code
                }
                api_response_with_context = json.dumps({
                    "type": "api_response",
                    "content": api_context,
                    "agent_name": agent_name,
                    "nesting_level": nesting_level
                })
                yield api_response_with_context + '\n'

                api_response_length = len(tokenizer.encode(api_response_json))
                all_messages_lengths += [api_response_length]
                current_total_length += api_response_length
                _, created_at = await chatSessionCRUD.write_message(
                    message_type="api_response",
                    content=json.dumps(api_context),
                    content_length=api_response_length,
                    account_uuid=current_account.uuid,
                    agent_id=agent_id,
                    chat_session_uuid=chat_session_uuid,
                    message_author_type="agent",
                    message_author_name=agent_name,
                    action_name=action_name,
                    action_type=action_name_to_action_type[action_name],
                    nesting_level=nesting_level,
                    update_session=True,
                )

                # Followup Prompt
                followup_prompt = all_followup_prompts.get(action_name)
                if followup_prompt: 
                    followup_prompt_length = len(tokenizer.encode(followup_prompt))
                    all_messages.append({
                        "role": "system",
                        "content": followup_prompt
                    })
                    all_messages_lengths += [followup_prompt_length]
                    current_total_length += followup_prompt_length
                    _, created_at = await chatSessionCRUD.write_message(
                        message_type="system",
                        content=followup_prompt,
                        content_length=followup_prompt_length,
                        account_uuid=current_account.uuid,
                        agent_id=agent_id,
                        chat_session_uuid=chat_session_uuid,
                        message_author_type="agent",
                        message_author_name=agent_name,
                        nesting_level=nesting_level,
                        update_session=True,
                    )

            elif action_name_to_action_type.get(action_name) == "expert_agent":
                # Get the expert agent id for the action (agent) chosen by ChatGPT
                expert_agent = await agentCRUD.get(agent_id=expert_agent_name_to_id[action_name])

                if settings.MONOID_ENVIRONMENT == "local":
                    print("\n============================================================")
                    print(f"[DEBUG] Expert Agent Info:")
                    print(f"EXPERT_AGENT_NAME: {action_name}")
                    print(f"EXPERT_AGENT_ID: {expert_agent.id}")
                    print("============================================================\n")
                
                # Let the client know that the expert agent is being called
                expert_agent_call_context = {
                    "expert_agent_name": action_name,
                    "expert_agent_id": expert_agent.id
                }
                yield json.dumps({
                    "type": "expert_agent_call_start",
                    "content": expert_agent_call_context,
                    "agent_name": agent_name,
                    "nesting_level": nesting_level
                }) + '\n'

                _, created_at = await chatSessionCRUD.write_message(
                    message_type="expert_agent_call_start",
                    content=json.dumps(expert_agent_call_context),
                    content_length=-1,
                    account_uuid=current_account.uuid,
                    agent_id=agent_id,
                    chat_session_uuid=chat_session_uuid,
                    message_author_type="agent",
                    message_author_name=agent_name,
                    nesting_level=nesting_level,
                    update_session=True,
                )
                
                # Recursive call to run the expert agent.
                # But all messages will be saved under the original agent_id and chat_session_uuid.
                expert_agent_messages = [latest_user_message]
                expert_agent_messages_lengths = [latest_user_message_length]
                expert_agent_config = AgentConfig.model_validate(expert_agent.agent_config)
                async for sub_stream in run_agent_stream(
                    latest_user_message=latest_user_message,
                    latest_user_message_length=latest_user_message_length,
                    all_messages=expert_agent_messages,
                    all_messages_lengths=expert_agent_messages_lengths,
                    agent_name=action_name,
                    agent_config=expert_agent_config,
                    chatSessionCRUD=chatSessionCRUD,
                    agentCRUD=agentCRUD,
                    current_account=current_account,
                    agent_id=agent_id,
                    chat_session_uuid=chat_session_uuid,
                    is_running_expert_agent=True,
                    nesting_level=nesting_level + 1,
                    llm_api_key=llm_api_key
                ):
                    yield sub_stream

                all_messages += [expert_agent_messages[-1]]
                all_messages_lengths += [expert_agent_messages_lengths[-1]]

                # Let the client know that the expert agent is done
                yield json.dumps({
                    "type": "expert_agent_call_finish",
                    "content": expert_agent_call_context,
                    "agent_name": agent_name,
                    "nesting_level": nesting_level
                }) + '\n'

                _, created_at = await chatSessionCRUD.write_message(
                    message_type="expert_agent_call_finish",
                    content=json.dumps(expert_agent_call_context),
                    content_length=-1,
                    account_uuid=current_account.uuid,
                    agent_id=agent_id,
                    chat_session_uuid=chat_session_uuid,
                    message_author_type="agent",
                    message_author_name=agent_name,
                    nesting_level=nesting_level,
                    update_session=True
                )

                if settings.MONOID_ENVIRONMENT == "local":
                    print("\n============================================================")
                    print(f"[DEBUG] Expert agent has responded.")
                    print("============================================================\n")

            # Only use last N messages that fills up to max_token_length requirements
            while current_total_length > max_token_length:
                if settings.MONOID_ENVIRONMENT == "local":
                    print("\n============================================================")
                    print(f"[DEBUG] {agent_name} -- Message history is too long:")
                    print(f"Excluding an earliest message: \n{all_messages[0]}")
                    print("============================================================\n")
                popped_message = all_messages.pop(0)
                popped_message_length = all_messages_lengths.pop(0)
                current_total_length -= popped_message_length

                if all_messages == []:
                    raise HTTPException(
                        status_code=http_status.HTTP_400_BAD_REQUEST,
                        detail=f"There is no message without surpassing the maximum token length, which is {max_token_length}."
                    )

            # Hit OpenAI again for a summary OR another Function Call
            if settings.MONOID_ENVIRONMENT == "local":
                print("\n============================================================")
                print(f"[DEBUG] {agent_name} -- Message history:")
                print(all_messages)
                print("============================================================\n")
            openai_response = await openai_function_call(
                all_messages, 
                all_function_call_configs, 
                streaming=True
            )
    
        # Break after the last OpenAI Call
        elif agent_full_response != "":
            if settings.MONOID_ENVIRONMENT == "local":
                print("\n============================================================")
                print(f"[DEBUG] {agent_name} -- Full Text:")
                print(agent_full_response)
                print("============================================================\n")

            all_messages_lengths += [agent_full_response_length]
            current_total_length += agent_full_response_length

            if not is_running_expert_agent:
                all_messages.append({
                    "role": "assistant",
                    "content": agent_full_response
                })

                _, created_at = await chatSessionCRUD.write_message(
                    message_type="language_response",
                    content=agent_full_response,
                    content_length=agent_full_response_length,
                    account_uuid=current_account.uuid,
                    agent_id=agent_id,
                    chat_session_uuid=chat_session_uuid,
                    message_author_type="agent",
                    message_author_name=agent_name,
                    nesting_level=nesting_level,
                    update_session=True,
                )

            else:
                all_messages.append({
                    "role": "function",
                    "name": agent_name,
                    "content": agent_full_response
                })

                _, created_at = await chatSessionCRUD.write_message(
                    message_type="expert_agent_language_response",
                    content=agent_full_response,
                    content_length=agent_full_response_length,
                    account_uuid=current_account.uuid,
                    agent_id=agent_id,
                    chat_session_uuid=chat_session_uuid,
                    message_author_type="agent",
                    message_author_name=agent_name,
                    nesting_level=nesting_level,
                    update_session=True,
                )

        elif not is_running_expert_agent:
            action_end_time = time.time()
            duration = round(action_end_time - action_start_time, 2)
            yield json.dumps({
                "type": "time_elapsed",
                "content": duration,
                "agent_name": agent_name,
                "nesting_level": nesting_level
            }) + '\n'
            break

        else:
            break


async def run_without_action(
    prev_messages: List[Dict[str, Any]],
):
    openai_response = await openai.ChatCompletion.acreate(
        model="gpt-4-0613",
        messages=prev_messages
    )
    openai_message = openai_response["choices"][0]["message"]
    agent_message = {
        "role": "assistant",
        "content": openai_message
    }
    prev_messages.append(agent_message)
    return openai_message, prev_messages