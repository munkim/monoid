import re
import time
import json
import openai
from typing import Any, List, Tuple, Dict, Union
from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status

import httpx
import asyncio
from sentry_sdk import capture_exception
import tiktoken

from monoid_backend.monoid.action.utils import call_api, openai_function_call, replace_parameters
from monoid_backend.api.v1.api_models.api_action import APIInfo, APIActionConfig
from monoid_backend.db_models.api_action import APIAction
from monoid_backend.monoid.action.action_config_model import (
    ActionType,
    APIActionParameter,
    APIActionParameters,
    Property,
    Properties,
    Parameter,
    FunctionCallConfig,
    FunctionCallPathAndPlacement,
    FunctionCallKeysToPaths,
    FunctionCallConfig,
    UserConfigurableParameter,
    UserConfigurables,
    APIConfig,
    ActionConfig
)
from monoid_backend.api.v1.api_models.configured_action import UserConfiguredArgument
from monoid_backend.config import settings

tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")


async def get_api_action_config(
    api_action: APIAction,
    api_action_snake_case_name: str,
    api_action_description: str,
    user_configured_arguments: List[UserConfiguredArgument] = []
) -> ActionConfig:
    
    api_config, _, function_call_keys_to_paths, function_call_config = await parse_api_action(
        action_snake_case_name=api_action_snake_case_name,
        action_description=api_action_description,
        method=api_action.method,
        template_url=api_action.template_url,
        headers=APIActionParameters.model_validate(api_action.headers),
        query_parameters=APIActionParameters.model_validate(api_action.query_parameters),
        path_parameters=APIActionParameters.model_validate(api_action.path_parameters),
        body=APIActionParameters.model_validate(api_action.body),
        user_configured_arguments=user_configured_arguments
    )
    
    action_config = ActionConfig(
        action_type=ActionType.api,
        api_config=api_config,
        followup_prompt=api_action.followup_prompt,
        function_call_config=function_call_config,
        function_call_keys_to_paths=function_call_keys_to_paths
    )
    
    return action_config


async def parse_api_action(
    action_snake_case_name: str,
    action_description: str,
    method: str,
    template_url: str,
    headers: APIActionParameters,
    query_parameters: APIActionParameters,
    path_parameters: APIActionParameters,
    body: APIActionParameters,
    user_configured_arguments: List[UserConfiguredArgument] = []
) -> Tuple[APIConfig, UserConfigurables, FunctionCallKeysToPaths, FunctionCallConfig]:
    # TODO: support both argument providers: agent and user/creator
    # API Config is supposed to be filled partially only with non-agent arguments
    api_config = {
        "method": method,
        "template_url": template_url,
        "headers": {},
        "query_parameters": {},
        "path_parameters": {},
        "body": {}
    }

    # Intermediary variables
    user_configurables = [] # List of properties (dict) that are configurable by the end user
    function_call_keys_to_paths = {} # List of keys used in the function call and their paths to original API Config (flat or nested)
    function_call_properties = {} # Dict of properties that are used directly in OpenAI's function call
    function_call_properties_required = [] # List of properties to indicate as required in OpenAI's function call

    user_configured_arguments_dict = {}
    for argument in user_configured_arguments:
        # User path instead of key because keys may not be unique
        user_configured_arguments_dict[argument.path] = (argument.key, argument.value, argument.placement)

    def parse_flat_parameters(parameters: APIActionParameters, placement: str):
        if not parameters or parameters.root is None:
            return
        
        for key, parameter in parameters.root.items():
            if not isinstance(parameter, APIActionParameter): 
                raise Exception(f"Parameter in {placement} is not an instance of APIActionParameter (flat dict)")

            if parameter.argument_provider != 'agent':
                if parameter.argument_provider == 'user':
                    # TODO: Cannot support if some keys have duplicate names 
                    # (e.g. "unique_key" in "key.unique_key" and "key.subkey.unique_key")
                    user_configurables.append(
                        UserConfigurableParameter(
                            key=parameter.key,
                            description=parameter.description,
                            data_type=parameter.data_type,
                            path=key,
                            placement=placement,
                            is_required=parameter.is_required,
                            enum=parameter.enum,
                        )
                    )
                api_config[placement][key] = parameter.value

                if user_configured_arguments_dict.get(key):
                    api_config[placement][key] = user_configured_arguments_dict[key][1]

                continue

            # Note which parameter was added to a function_call
            function_call_keys_to_paths[key] = FunctionCallPathAndPlacement(
                path=key,
                placement=placement,
            )

            # Add parameter to a function call prperties
            function_call_properties[ key ] = {
                "type": parameter.data_type,
                "description": parameter.description
            }

            if parameter.is_required:
                function_call_properties_required.append(key)


    parse_flat_parameters(headers, "headers")
    parse_flat_parameters(query_parameters, "query_parameters")
    parse_flat_parameters(path_parameters, "path_parameters")

    # For all path parameters not provided by agent, replace the template URL with the actual values
    if path_parameters and path_parameters.root:
        for key, parameter in path_parameters.root.items():
            if parameter.argument_provider != 'agent':
                api_config["template_url"] = replace_parameters(api_config["template_url"], key, parameter.value)

    # Helper function
    def parse_nested_parameters(parameter: Union[APIActionParameter, APIActionParameters], path: str):
        sub_api_config = {}

        if isinstance(parameter, APIActionParameters):
            if parameter.root is None:
                return None
            
            for key, sub_param in parameter.root.items():
                sub_api_config[key] = parse_nested_parameters(sub_param, path + '.' + key if path != "" else key)
        
        if isinstance(parameter, APIActionParameter):

            if parameter.argument_provider != 'agent':
                if parameter.argument_provider == 'user':
                    user_configurables.append(
                        UserConfigurableParameter(
                            key=parameter.key,
                            description=parameter.description,
                            data_type=parameter.data_type,
                            path=path,
                            placement="body",
                            is_required=parameter.is_required,
                            enum=parameter.enum,
                        )
                    )
                sub_api_config[parameter.key] = parameter.value

                if user_configured_arguments_dict.get(path):
                    sub_api_config[parameter.key] = user_configured_arguments_dict[path][1]
                
                return sub_api_config


            function_call_keys_to_paths[parameter.key] = FunctionCallPathAndPlacement(
                path=path,
                placement="body",
            )

            function_call_properties[parameter.key] = Property(
                type=parameter.data_type,
                description=parameter.description
            )
            if parameter.is_required: 
                function_call_properties_required.append(parameter.key)

        return sub_api_config
    
    if body and body.root:
        # If nested create a path joining all parent parameter keys with a dot
        api_config["body"] = parse_nested_parameters(body, "")


    # Create objects that will be used
    # to create the ConfiguredAction object,
    # and to test the action.
    api_config = APIConfig(**api_config)
    user_configurables = UserConfigurables(user_configurables)
    function_call_keys_to_paths = FunctionCallKeysToPaths(function_call_keys_to_paths)
    
    # Create function call config to be used directly in OpenAI's function call
    function_call_config = FunctionCallConfig(
        name=action_snake_case_name,
        description=action_description,
        parameters=Parameter(
            type="object",
            properties=Properties(function_call_properties),
            required=function_call_properties_required
        )
    )

    return api_config, user_configurables, function_call_keys_to_paths, function_call_config

async def run_action(
    user_message: str,
    followup_prompt: str,
    api_config: APIConfig,
    function_call_keys_to_paths: FunctionCallKeysToPaths,
    function_call_config: FunctionCallConfig,
    max_token_length = 4000
):

    all_messages = [
        {
            "role": "system",
            "content": "You are a helpful assistant that can leverage APIs to help users. If any parameters are missing, please ask the user for the input."
        },
        {
            "role": "user",
            "content": user_message
        }
    ]

    current_total_length = 0
    for message in all_messages:
        current_total_length += len(tokenizer.encode(message["content"]))
    
    if current_total_length > max_token_length:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Input to LLM is too long. Current Total Length (without API call) is {current_total_length} tokens. Max is {max_token_length}."
        )

    openai_response = await openai_function_call(all_messages, [function_call_config])
    new_messages = []
    while openai_response["choices"][0]["message"].get("function_call"):
        function_name = openai_response["choices"][0]["message"]["function_call"]["name"]
        openai_arguments = json.loads(openai_response["choices"][0]["message"]["function_call"]["arguments"])

        # Make API action call
        method, url, query_parameters, body, api_response, api_status_code = await call_api(api_config, function_call_keys_to_paths, openai_arguments)
        api_response = json.dumps(api_response)

        # Add the API response and followup prompt to the message history
        intermediary_messages = [
            {
                "role": "function",
                "name": function_name,
                "content": api_response
            }
        ]
        if followup_prompt: 
            intermediary_messages.append({
                "role": "user",
                "content": followup_prompt
            })
        new_messages += intermediary_messages
        all_messages += intermediary_messages

        # Check if the API response is too long
        api_response_length = len(tokenizer.encode(api_response))
        current_total_length += api_response_length
        if current_total_length > max_token_length:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Input to LLM is too long. Current Total Length is {current_total_length} tokens (API Response has {api_response_length}). Max is {max_token_length}."
            )

        # Call OpenAI again
        openai_response = await openai_function_call(all_messages, [function_call_config])

    language_response = openai_response["choices"][0]["message"]["content"]
    agent_message = {
        "role": "assistant",
        "content": language_response
    }
    new_messages.append(agent_message)
    all_messages.append(agent_message)
    return language_response, new_messages




async def run_action_stream(
    user_message: str,
    followup_prompt: str,
    api_config: APIConfig,
    function_call_keys_to_paths: FunctionCallKeysToPaths,
    function_call_config: FunctionCallConfig,
    max_token_length = 4000
):
    
    all_messages = [
        {
            "role": "system",
            "content": "You are a helpful assistant that can leverage APIs to help users. If any parameters are missing, please ask the user for the input."
        },
        {
            "role": "user",
            "content": user_message
        }
    ]

    current_total_length = 0
    for message in all_messages:
        current_total_length += len(tokenizer.encode(message["content"]))
    
    if current_total_length > max_token_length:
        yield json.dumps({
            "type": "language_response",
            "content": f"Input to LLM is too long. Current Total Length is {current_total_length} tokens. Max is {max_token_length}.",
            "agent_name": 'Simulated Agent',
            "nesting_level": 0
        }) + '\n'

        return

    openai_response = await openai_function_call(
            all_messages, 
            [function_call_config], 
            streaming=True
        )

    action_start_time = time.time()

    new_messages = []
    while True:
        action_name = ""
        api_parameters_json = ""
        full_text = ""

        # At the end of the loop, either api_parameters_json 
        # or full_text will be populated, but not both.
        async for chunk in openai_response:
            delta = chunk["choices"][0]["delta"]
            if delta == {}: 
                if settings.MONOID_ENVIRONMENT == "local":
                    print("\n[DEBUG] Empty delta in a chunk:")
                    print(chunk)
                break

            if 'function_call' in delta:
                action_name = delta["function_call"].get("name", action_name)
                api_parameters_json_delta = delta["function_call"]["arguments"]
                api_parameters_json += api_parameters_json_delta
                yield json.dumps({
                    "type": "action_call",
                    "content": {
                        "name": action_name,
                        "action_type": 'api',
                        "arguments": api_parameters_json_delta
                    },
                    "agent_name": 'Simulated Agent',
                    "nesting_level": 0
                }) + '\n'

            # This would be the last OpenAI response
            elif 'content' in delta:
                text = delta['content']
                full_text += text
                yield json.dumps({
                    "type": "language_response",
                    "content": text,
                    "agent_name": 'Simulated Agent',
                    "nesting_level": 0
                }) + '\n'
                
            else:
                if settings.MONOID_ENVIRONMENT == "local":
                    print("\n[DEBUG] Unknown delta type in a chunk:")
                    print(chunk)
                break
        
        # Make the API Call given api_parameter_json.
        # If OpenAI response was about a function call,
        # then api_parameters_json would have been populated.
        if api_parameters_json != "":
            if settings.MONOID_ENVIRONMENT == "local":
                print("\n============================================================")
                print(f"\n[DEBUG] {action_name} api_parameter_json:")
                print(api_parameters_json)
                print(api_config)
                print("============================================================\n")
            
            openai_arguments = json.loads(api_parameters_json)

            # Make API action call
            api_start_time = time.time()
            method, url, query_parameters, body, api_response, api_status_code = await call_api(
                    api_config, 
                    function_call_keys_to_paths, 
                    openai_arguments
                )

            if settings.MONOID_ENVIRONMENT == "local":
                print("\n============================================================")
                print(f"\n[DEBUG] API Call:")
                print(url)
                print(query_parameters)
                print(body)
                print(api_response)
                print(api_status_code)
                print("============================================================\n")

            api_end_time = time.time()
            api_response = json.dumps(api_response)

            # Add the API response and followup prompt to the message history
            intermediary_messages = [
                {
                    "role": "function",
                    "name": action_name,
                    "content": api_response
                }
            ]
            if followup_prompt: 
                intermediary_messages.append({
                    "role": "user",
                    "content": followup_prompt
                })
            new_messages += intermediary_messages
            all_messages += intermediary_messages

            # Check if the API response is too long
            api_response_length = len(tokenizer.encode(api_response))
            current_total_length += api_response_length
            if current_total_length > max_token_length:
                yield json.dumps({
                    "type": "language_response",
                    "content": f"Input to LLM is too long. Current Total Length is {current_total_length} tokens (API Response has {api_response_length}). Max is {max_token_length}.",
                    "agent_name": 'Simulated Agent',
                    "nesting_level": 0
                }) + '\n'

                return

            # Add api_response to the stream
            # right after the action_call stream
            yield json.dumps({
                "type": "api_response",
                "content": {
                    "name": action_name,
                    "method": method,
                    "url": url,
                    "query_parameters": query_parameters,
                    "body": body,
                    "response": api_response,
                    "time_elapsed": round(api_end_time - api_start_time, 2),
                    "status_code": api_status_code
                }
            }) + '\n'

            # Hit OpenAI again for a summary OR another Function Call
            openai_response = await openai_function_call(
                    all_messages, 
                    [function_call_config], 
                    streaming=True
                )
        
        # Break after the last OpenAI Call
        else:
            if settings.MONOID_ENVIRONMENT == "local":
                print("\n============================================================")
                print("\n[DEBUG] Full Text:")
                print(full_text)
                print("============================================================\n")

            action_end_time = time.time()
            duration = round(action_end_time - action_start_time, 2)
            yield json.dumps({
                "type": "time_elapsed",
                "content": duration
            }) + '\n'
            break
