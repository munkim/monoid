import json
from typing import Any, List, Tuple
from sentry_sdk import capture_exception
from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status

from monoid_backend.api import helpers
from monoid_backend.api.v1.api_models.status_message import StatusMessage
from monoid_backend.api.v1.api_models.action import ActionCategory
from monoid_backend.crud.agent_crud import AgentCRUD, get_agent_crud
from monoid_backend.crud.configured_action_crud import ConfiguredActionCRUD, get_configured_action_crud
from monoid_backend.crud.agent_schedule_crud import AgentScheduleCRUD, get_agent_schedule_crud

from monoid_backend.db_models.account import Account
from monoid_backend.api.v1.api_models.agent import (
    AgentBase,
    AgentReadResponse,
    AgentReadEncodedResponse,
    AgentListReadResponse,
    AgentCreateRequest,
    AgentPatchRequest,
    URLAvailabilityResponse
)

router = APIRouter()


@router.post(
    "",
    response_model=AgentReadResponse,
    status_code=http_status.HTTP_201_CREATED,
    description="Create and return an agent (aka project)"
)
async def create_agent(
    data: AgentCreateRequest,
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> AgentReadResponse:
    url = f"{data.subdomain}.monoid.so/{data.slug}"
    agent = await agentCRUD.get_agent_by_url(url=url)
    if agent:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=f"Agent with the url ({data.url}) already exists"
        )

    agent = await agentCRUD.create(
        data=data,
        url=url,
        creator=current_account
    )

    agent = AgentReadResponse(
        agent_id=agent.id,
        name=agent.name,
        snake_case_name=agent.snake_case_name,
        description=agent.description,
        instructions=agent.instructions,
        subdomain=agent.url.split(".")[0], # TODO: Remove this hack
        slug=agent.slug,
        agent_type=agent.agent_type,
        is_public=agent.is_public,
        llm_option=agent.llm_option,
        llm_api_key=agent.llm_api_key,
        is_editable=True,
        categories=[
            ActionCategory(
                category_id=category.id,
                name=category.name,
                description=category.description
            ) for category in agent.categories
        ],
    )
    
    return agent


@router.get(
    "",
    response_model=AgentListReadResponse,
    status_code=http_status.HTTP_200_OK,
    description="User's landing page view. Get a list of agents (and their basic info) that the current account has access to as a creator."
)
async def get_agent_list(
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> AgentListReadResponse:
    agents = await agentCRUD.get_agents_by_account_uuid(account_uuid=current_account.uuid)
    
    agents = agents if agents is not None else []
    agent_list = []
    for agent in agents:
        try: 
            _agent = AgentReadResponse(
                agent_id=agent.id,
                name=agent.name,
                snake_case_name=agent.snake_case_name,
                description=agent.description,
                instructions=agent.instructions,
                subdomain=agent.url.split(".")[0], # TODO: Remove this hack
                slug=agent.slug,
                agent_type=agent.agent_type,
                is_public=agent.is_public,
                llm_option=agent.llm_option,
                llm_api_key=agent.llm_api_key if current_account.uuid == agent.creator_id else None,
                is_editable=True,
                categories=[
                    ActionCategory(
                        category_id=category.id,
                        name=category.name,
                        description=category.description
                    ) for category in agent.categories
                ],
            )
            agent_list.append(_agent)
        except Exception as e:
            capture_exception(e)
            continue

    agent_base_list = AgentListReadResponse(
        agent_base_list=agent_list
    )

    return agent_base_list


@router.get(
    "/{agent_id}",
    response_model=AgentReadResponse,
    status_code=http_status.HTTP_200_OK,
    description="For agent configuration view; in case the frontend doesn't have the agent info already from the list view. Get details of an agent given agent_id."
)
async def get_agent_details_by_id(
    agent_id: int,
    debug: str = 'false',
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> AgentReadResponse:
    agent = await agentCRUD.get(agent_id=agent_id)

    if not agent:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Agent with id ({agent_id})"
        )

    # if current_account.uuid != agent.creator_id:
    #     raise HTTPException(
    #         status_code=http_status.HTTP_401_UNAUTHORIZED,
    #         detail="You are not authorized to access this agent"
    #     )
    
    # if debug == 'true':
    #     agent_details = AgentReadResponse(
    #         agent_id=agent.id,
    #         name=agent.name,
    #         snake_case_name=agent.snake_case_name,
    #         description=agent.description,
    #         instructions=agent.instructions,
    #         subdomain=agent.url.split(".")[0], # TODO: Remove this hack
    #         slug=agent.slug,
    #         agent_type=agent.agent_type,
    #         is_public=agent.is_public,
    #         llm_option=agent.llm_option,
    #         llm_api_key=agent.llm_api_key if current_account.uuid == agent.creator_id else None, 
    #         is_editable=True,
    #         agent_config=json.dumps(agent.agent_config) if debug else None,
    #         categories=[
    #             ActionCategory(
    #                 category_id=category.id,
    #                 name=category.name,
    #                 description=category.description
    #             ) for category in agent.categories
    #         ],
    #     )
    # else:
    agent_details = AgentReadResponse(
        agent_id=agent.id,
        name=agent.name,
        snake_case_name=agent.snake_case_name,
        description=agent.description,
        instructions=agent.instructions,
        subdomain=agent.url.split(".")[0], # TODO: Remove this hack
        slug=agent.slug,
        agent_type=agent.agent_type,
        is_public=agent.is_public,
        llm_option=agent.llm_option,
        llm_api_key=agent.llm_api_key if current_account.uuid == agent.creator_id else None, 
        is_editable=current_account.uuid == agent.creator_id,
        categories=[
            ActionCategory(
                category_id=category.id,
                name=category.name,
                description=category.description
            ) for category in agent.categories
        ],
    )

    return agent_details


@router.get(
    "/url/{subdomain}/{slug}",
    response_model=AgentReadEncodedResponse,
    status_code=http_status.HTTP_200_OK,
    description="For chat / public view. Get details of an agent given agent_id"
)
async def get_agent_details_by_url(
    # url: str,
    subdomain: str,
    slug: str,
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> AgentReadEncodedResponse:
    url = f"{subdomain}.monoid.so/{slug}"
    agent = await agentCRUD.get_agent_by_url(url=url)

    if not agent:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Agent with url ({url})"
        )

    if not agent.is_public and current_account.uuid != agent.creator_id:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to access this agent"
        )
    
    encoded_agent_config = helpers.encode_json(agent.agent_config) if agent.agent_config else ""
    agent_details = AgentReadEncodedResponse(
        agent_id=agent.id,
        name=agent.name,
        snake_case_name=agent.snake_case_name,
        description=agent.description,
        instructions=agent.instructions,
        # TODO: Remove this hack. Had to do this because of this endpoint.
        # The path param cannot accept a full url. But we need to use a full url as a unique index key for each agent.
        # We either need to somehow embed a full url on a path param, or include it in a body, etc.
        subdomain=agent.url.split(".")[0],
        slug=agent.slug,
        agent_type=agent.agent_type,
        is_public=agent.is_public,
        llm_option=agent.llm_option,
        llm_api_key=agent.llm_api_key if current_account.uuid == agent.creator_id else None,
        is_editable=True,
        categories=[
            ActionCategory(
                category_id=category.id,
                name=category.name,
                description=category.description
            ) for category in agent.categories
        ],
        encoded_agent_config=encoded_agent_config
    )

    return agent_details


@router.get(
    "/url-check/{subdomain}/{slug}",
    response_model=URLAvailabilityResponse,
    status_code=http_status.HTTP_200_OK,
    description="Check if a url is available for use"
)
async def get_agent_details_by_url(
    subdomain: str,
    slug: str,
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
) -> URLAvailabilityResponse:
    url = f"{subdomain}.monoid.so/{slug}"
    agent = await agentCRUD.get_agent_by_url(url=url)
    is_available = agent is None
    
    return URLAvailabilityResponse(
        is_available=is_available,
        message="Available" if is_available else "Not Available"
    )


@router.patch(
    "/{agent_id}",
    response_model=AgentReadResponse,
    status_code=http_status.HTTP_200_OK,
    description="Patch agent info given agent_id"
)
async def patch_agent_by_id(
    agent_id: int,
    data: AgentPatchRequest,
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> AgentReadResponse:
    agent = await agentCRUD.get(agent_id=agent_id)

    if not agent:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Agent with id ({agent_id})"
        )
    
    if current_account.uuid != agent.creator_id:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to modify this agent"
        )

    agent = await agentCRUD.patch(agent=agent, data=data)
    
    agent = AgentReadResponse(
        agent_id=agent.id,
        name=agent.name,
        snake_case_name=agent.snake_case_name,
        description=agent.description,
        instructions=agent.instructions,
        subdomain=agent.url.split(".")[0], # TODO: Remove this hack
        slug=agent.slug,
        agent_type=agent.agent_type,
        is_public=agent.is_public,
        llm_option=agent.llm_option,
        llm_api_key=agent.llm_api_key if current_account.uuid == agent.creator_id else None,
        is_editable=True,
        categories=[
            ActionCategory(
                category_id=category.id,
                name=category.name,
                description=category.description
            ) for category in agent.categories
        ],
    )

    return agent


@router.delete(
    "/{agent_id}",
    response_model=StatusMessage,
    status_code=http_status.HTTP_200_OK,
    description="Delete an agent given agent_id"
)
async def delete_agent_by_id(
    agent_id: int,
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    agentScheduleCRUD: AgentScheduleCRUD = Depends(get_agent_schedule_crud),
    configuredActionCRUD: ConfiguredActionCRUD = Depends(get_configured_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> StatusMessage:
    agent = await agentCRUD.get(agent_id=agent_id)

    if not agent:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Agent with id ({agent_id})"
        )
    
    if current_account.uuid != agent.creator_id:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to delete this agent"
        )
    
    # Delete schedules and actions first
    for schedule in agent.agent_schedules:
        await agentScheduleCRUD.delete(agent_schedule=schedule)

    # Delete all actions for this agent
    await configuredActionCRUD.delete_for_agent(agent=agent)
    
    status = await agentCRUD.delete(agent=agent)

    return {"status": status, "message": "The agent has been deleted!"}


#===============================================================================
# Category Read / Write
#===============================================================================
@router.get(
    "/category/{category_id}",
    response_model=AgentListReadResponse,
    status_code=http_status.HTTP_200_OK,
    description="Get a list of Actions (and their basic info) that the current account has access to as a creator"
)
async def get_action_list_by_category_id(
    category_id: str,
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> AgentListReadResponse:
    agents = await agentCRUD.get_agents_by_category_id(category_id=category_id)

    if agents is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find any Agents with category id {category_id}"
        )
    
    agent_base_list = AgentListReadResponse(
        agent_base_list=[AgentReadResponse(
            agent_id = agent.id,
            name = agent.name,
            snake_case_name = agent.snake_case_name,
            description = agent.description,
            instructions = agent.instructions,
            subdomain = agent.url.split(".")[0], # TODO: Remove this hack
            slug = agent.slug,
            agent_type = agent.agent_type,
            is_public = agent.is_public,
            llm_option = agent.llm_option,
            llm_api_key=agent.llm_api_key if current_account.uuid == agent.creator_id else None,
            is_editable = agent.creator_id == current_account.uuid
        ) for agent in agents if agent.is_public or agent.creator_id == current_account.uuid]
    )

    return agent_base_list
