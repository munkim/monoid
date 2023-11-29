from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status

from monoid_backend.api import helpers
from monoid_backend.api.v1.api_models.status_message import StatusMessage
from monoid_backend.crud.agent_crud import AgentCRUD, get_agent_crud
from monoid_backend.crud.action_crud import ActionCRUD, get_action_crud
from monoid_backend.crud.api_action_crud import APIActionCRUD, get_api_action_crud
from monoid_backend.crud.configured_action_crud import ConfiguredActionCRUD, get_configured_action_crud
from monoid_backend.monoid.action.api_action_config import get_api_action_config
from monoid_backend.monoid.action.expert_action_config import get_expert_action_config
from monoid_backend.db_models.account import Account
from monoid_backend.monoid.action.action_config_model import ActionType
from monoid_backend.api.v1.api_models.configured_action import (
    ConfiguredActionResponse,
    ConfiguredActionCreateRequest,
    ConfiguredActionPatchRequest
)

router = APIRouter()


@router.post(
    "/{agent_id}/configured-action",
    response_model=ConfiguredActionResponse,
    status_code=http_status.HTTP_201_CREATED,
    description="Create and return an configured action"
)
async def create_configured_action(
    agent_id: int,
    data: ConfiguredActionCreateRequest,
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    apiActionCRUD: APIActionCRUD = Depends(get_api_action_crud),
    configuredActionCRUD: ConfiguredActionCRUD = Depends(get_configured_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ConfiguredActionResponse:
    agent = await agentCRUD.get(agent_id=agent_id)
    if not agent:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Agent with id {agent_id}"
        )

    # Either action_id or expert_agent_id (not both) should be provided in order to create a configured action
    try: 
        assert (not data.action_id) or (not data.expert_agent_id)
    except AssertionError:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Either action_id or expert_agent_id (but not both) must be provided"
        )
    
    if data.action_id:
        expert_agent = None
        action_type = ActionType.api

        # Check if the api action exists
        api_action = await apiActionCRUD.get(action_id=data.action_id)
        if not api_action:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Cannot find Action with id {data.action_id}"
            )
        
        # Create the action config using api action
        action_config = await get_api_action_config(
            api_action=api_action,
            api_action_snake_case_name=data.snake_case_name,
            api_action_description=data.description,
            user_configured_arguments=data.user_configured_arguments
        )

        # Check if the api action already exists for this agent
        existing_action = await configuredActionCRUD.get_configured_action_by_action_id(
            agent_id=agent_id,
            action_id=data.action_id
        )
        if existing_action:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail=f"Action ({data.action_id}) already exists for Agent ({agent_id})"
            )
        
    elif data.expert_agent_id:
        try: 
            assert data.expert_agent_id != agent_id
        except AssertionError:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Expert Agent cannot be the same as the Agent"
            )

        api_action = None
        action_type = ActionType.expert_agent

        # Check if the expert agent exists
        expert_agent = await agentCRUD.get(agent_id=data.expert_agent_id)
        if not expert_agent:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Cannot find Agent with id {data.expert_agent_id}"
            )
        
        # Create the action config using expert agent
        action_config = await get_expert_action_config(
            agent=expert_agent,
            agent_snake_case_name=data.snake_case_name,
            agent_description=data.description,
            user_configured_arguments=data.user_configured_arguments
        )

        # Check if the expert configured action already exists for this agent
        existing_action = await configuredActionCRUD.get_configured_action_by_expert_agent_id(
            agent_id=agent_id,
            expert_agent_id=data.expert_agent_id
        )
        if existing_action:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail=f"Expert Agent ({data.expert_agent_id}) already exists for Agent ({agent_id})"
            )
    else:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Either action_id or expert_agent_id must be provided"
        )

    new_configured_action = await configuredActionCRUD.create(
        agent_id=agent_id,
        action_type=action_type,
        action_config=action_config,
        data=data,
        agent=agent,
        expert_agent=expert_agent,
        api_action=api_action,
        creator=current_account
    )

    configured_action = ConfiguredActionResponse(
        configured_action_id=new_configured_action.id,
        agent_id=new_configured_action.agent_id,
        action_id=new_configured_action.action_id,
        expert_agent_id=new_configured_action.expert_agent_id,
        name=new_configured_action.name,
        snake_case_name=new_configured_action.snake_case_name,
        description=new_configured_action.description,
        user_configured_arguments=new_configured_action.user_configured_arguments
    )

    return configured_action


@router.get(
    "/{agent_id}/configured-action",
    response_model=List[ConfiguredActionResponse],
    status_code=http_status.HTTP_200_OK,
    description="Get details of an agent given agent_id"
)
async def get_configured_actions_by_agent_id(
    agent_id: int,
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> List[ConfiguredActionResponse]:
    agent = await agentCRUD.get(agent_id=agent_id)

    if not agent:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Agent ({agent_id}) not found"
        )

    # if current_account.uuid != agent.creator_id:
    #     raise HTTPException(
    #         status_code=http_status.HTTP_401_UNAUTHORIZED,
    #         detail="You are not authorized to access this agent's actions"
    #     )

    configured_actions = [
        ConfiguredActionResponse(
            configured_action_id=configured_action.id,
            agent_id=configured_action.agent_id,
            action_id=configured_action.action_id,
            expert_agent_id=configured_action.expert_agent_id,
            name=configured_action.name,
            snake_case_name=configured_action.snake_case_name,
            description=configured_action.description,
            user_configured_arguments=configured_action.user_configured_arguments
        ) for configured_action in agent.configured_actions
    ] if agent.configured_actions != [] else []

    return configured_actions


@router.get(
    "/{agent_id}/configured-action/{configured_action_id}",
    response_model=ConfiguredActionResponse,
    status_code=http_status.HTTP_200_OK,
    description="Get details of an agent given agent_id"
)
async def get_configured_actions_by_id(
    agent_id: int,
    configured_action_id: int,
    configuredActionCRUD: ConfiguredActionCRUD = Depends(get_configured_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> List[ConfiguredActionResponse]:
    current_configured_action = await configuredActionCRUD.get(configured_action_id=configured_action_id)
    if not current_configured_action:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Configured Action with id {configured_action_id}"
        )
    
    if current_account.uuid != current_configured_action.creator_id:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to access this configured action"
        )

    configured_action = ConfiguredActionResponse(
        configured_action_id=current_configured_action.id,
        agent_id=current_configured_action.agent_id,
        action_id=current_configured_action.action_id,
        expert_agent_id=current_configured_action.expert_agent_id,
        name=current_configured_action.name,
        snake_case_name=current_configured_action.snake_case_name,
        description=current_configured_action.description,
        user_configured_arguments=current_configured_action.user_configured_arguments
    )

    return configured_action



@router.patch(
    "/{agent_id}/configured-action/{configured_action_id}",
    response_model=ConfiguredActionResponse,
    status_code=http_status.HTTP_200_OK,
    description="Patch agent info given agent_id"
)
async def patch_configured_action_by_id(
    agent_id: int,
    configured_action_id: int,
    data: ConfiguredActionPatchRequest,
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    configuredActionCRUD: ConfiguredActionCRUD = Depends(get_configured_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ConfiguredActionResponse:
    current_configured_action = await configuredActionCRUD.get(configured_action_id=configured_action_id)
    if not current_configured_action:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Configured Action with id {configured_action_id}"
        )
    
    if current_account.uuid != current_configured_action.creator_id:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to modify configuration of this configured action"
        )


    agent = await agentCRUD.get(agent_id=agent_id)
    if not agent:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Agent with id ({agent_id})"
        )
    
    if current_configured_action.action_type == ActionType.api:
        updated_action_config = await get_api_action_config(
            api_action=current_configured_action.api_action,
            api_action_snake_case_name=data.snake_case_name,
            api_action_description=data.description,
            user_configured_arguments=data.user_configured_arguments
        )
    elif current_configured_action.action_type == ActionType.expert_agent:
        updated_action_config = await get_expert_action_config(
            agent=current_configured_action.expert_agent,
            agent_snake_case_name=data.snake_case_name,
            agent_description=data.description,
            user_configured_arguments=data.user_configured_arguments
        )
    else:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot get updated_action_config for this action type {current_configured_action.action_type}"
        )

    reconfigured_action = await configuredActionCRUD.patch(
        agent=agent,
        new_action_config=updated_action_config, 
        configured_action=current_configured_action, 
        data=data
    )

    configured_actions = ConfiguredActionResponse(
        configured_action_id=reconfigured_action.id,
        agent_id=reconfigured_action.agent_id,
        action_id=reconfigured_action.action_id,
        expert_agent_id=reconfigured_action.expert_agent_id,
        name=reconfigured_action.name,
        snake_case_name=reconfigured_action.snake_case_name,
        description=reconfigured_action.description,
        user_configured_arguments=reconfigured_action.user_configured_arguments
    )

    return configured_actions


@router.delete(
    "/{agent_id}/configured-action/{configured_action_id}",
    response_model=StatusMessage,
    status_code=http_status.HTTP_200_OK,
    description="Delete an agent given agent_id"
)
async def delete_configured_action_by_id(
    agent_id: int,
    configured_action_id: int,
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    configuredActionCRUD: ConfiguredActionCRUD = Depends(get_configured_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> StatusMessage:
    current_configured_action = await configuredActionCRUD.get(configured_action_id=configured_action_id)
    if not current_configured_action:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Configured Action with id {configured_action_id}"
        )

    if current_account.uuid != current_configured_action.creator_id:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to delete this configured action"
        )

    agent = await agentCRUD.get(agent_id=agent_id)
    if not agent:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Agent with id ({agent_id})"
        )
    
    status = await configuredActionCRUD.delete(
        agent=agent,
        configured_action=current_configured_action
    )

    return {"status": status, "message": "The configured action has been deleted!"}
