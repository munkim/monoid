import re
import json
import openai
from typing import Any, List, Tuple, Dict
from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status

import httpx
import asyncio
import tiktoken

from monoid_backend.db_models.account import Account
from monoid_backend.crud.chat_session_crud import ChatSessionCRUD
from monoid_backend.monoid.action.action_config_model import (
    FunctionCallConfig,
    FunctionCallKeysToPaths,
    FunctionCallConfig,
    APIConfig,
    AgentConfig,
    FunctionCallConfig,
    NestedParameter
)


def replace_parameters(template_url, key, value):
    return template_url.replace("{" + key + "}", value if value != None else "")


async def openai_function_call(
    prev_messages: List[Any],
    functions: List[FunctionCallConfig],
    streaming: bool = False,
    model_name: str = "gpt-3.5-turbo-16k-0613",
    api_key: str = None
):
    if functions == []:
        response = await openai.ChatCompletion.acreate(
            messages=prev_messages,
            stream=streaming,
            model=model_name,
            api_key=api_key,
        )
    else:
        functions_in_json = [func.model_dump() for func in functions]
        response = await openai.ChatCompletion.acreate(
            messages=prev_messages,
            functions = functions_in_json,
            function_call="auto",
            stream=streaming,
            model=model_name,
            api_key=api_key,
        )
    return response


async def call_api(
    api_config: APIConfig,
    function_call_keys_to_paths: FunctionCallKeysToPaths, # TODO: Make this Optional (It would be None when expert actions)
    openai_arguments: dict
):
    """
    Call API using the API config and the function call arguments.
    """
    # Complete the API config with the arguments from OpenAI function call
    url = api_config.template_url
    
    api_config = api_config.model_dump()
    for key, path_dict in function_call_keys_to_paths.root.items():
        # Get the value from the function call arguments
        value = openai_arguments.get(key)
        if path_dict.placement == "path_parameters":
            # Replace path parameters in the template URL
            url = replace_parameters(url, key, value)
        elif path_dict.placement == "body":
            # If nested, recurse through the path and set the value
            # Note that these paths may not exist in the API config yet
            path = path_dict.path.split('.')
            current = api_config["body"]
            for i in range(len(path) - 1):
                if path[i] not in current:
                    current[path[i]] = {}
                current = current[path[i]]
            current[path[-1]] = value
        else:
            api_config[path_dict.placement][path_dict.path] = value 

    # Check if there are any remaining parameters on the URL
    remaining_path_params = re.findall(r"\{(.*?)\}", url)
    if remaining_path_params != []:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Missing path parameter(s)."
        )
    
    # Call the API
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=api_config["method"],
            url=url,
            headers=api_config["headers"],
            params=api_config["query_parameters"],
            json=api_config["body"]
        )

    # Check status code
    if 200 <= response.status_code < 300:
        print("Status code indicates success.")

        # Try parsing JSON
        try:
            response_json = response.json()
            print("JSON parsed successfully:", response_json)
            return api_config["method"], url, api_config["query_parameters"], api_config["body"], response_json, response.status_code
        except Exception as e:
            return api_config["method"], url, api_config["query_parameters"], api_config["body"], f"Failed to parse JSON: \n{e}", response.status_code
    else:
        return api_config["method"], url, api_config["query_parameters"], api_config["body"], f"Request failed with status code {response.status_code}.", response.status_code

