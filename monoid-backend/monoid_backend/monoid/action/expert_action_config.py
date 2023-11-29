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
from monoid_backend.db_models.agent import Agent
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
    ExpertAgentConfig,
    ActionConfig
)
from monoid_backend.api.v1.api_models.configured_action import UserConfiguredArgument
from monoid_backend.config import settings

tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")


from re import sub
def snake_case(s):
  return '_'.join(
    sub('([A-Z][a-z]+)', r' \1',
    sub('([A-Z]+)', r' \1',
    s.replace('-', ' '))).split()).lower()


async def get_expert_action_config(
    agent: Agent,
    agent_snake_case_name: str,
    agent_description: str,
    user_configured_arguments: List[UserConfiguredArgument] = [] # TODO: Use this when Expert Agent is configurable
) -> ActionConfig:
    
    expert_action_config, function_call_config = await parse_expert_agent_into_action(
        agent=agent,
        agent_snake_case_name=agent_snake_case_name,
        agent_description=agent_description
    )
    
    action_config = ActionConfig(
        action_type=ActionType.expert_agent,
        expert_agent_config=expert_action_config,
        function_call_config=function_call_config
    )
    
    return action_config


async def parse_expert_agent_into_action(
    agent: Agent,
    agent_snake_case_name: str,
    agent_description: str,
) -> Tuple[ExpertAgentConfig, FunctionCallConfig]:
    agent_snake_case_name = agent_snake_case_name
    agent_description = agent_description
    expert_agent_config = ExpertAgentConfig(
       expert_agent_id=agent.id
    )
    
    # Create function call config to be used directly in OpenAI's function call
    function_call_config = FunctionCallConfig(
        name=agent_snake_case_name,
        description=agent_description,
        parameters=Parameter(
            type="object",
            properties=Properties({}),
            required=[]
        )
    )

    return expert_agent_config, function_call_config
