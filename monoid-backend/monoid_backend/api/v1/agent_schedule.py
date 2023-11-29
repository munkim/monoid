from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status

from monoid_backend.api import helpers
from monoid_backend.api.v1.api_models.status_message import StatusMessage
from monoid_backend.crud.agent_crud import AgentCRUD, get_agent_crud
from monoid_backend.crud.account_crud import AccountCRUD, get_account_crud
from monoid_backend.crud.agent_schedule_crud import AgentScheduleCRUD, get_agent_schedule_crud
from monoid_backend.db_models.account import Account
from monoid_backend.api.v1.api_models.agent_schedule import (
    AgentScheduleBase,
    AgentScheduleCreatePatchRequest,
    AgentScheduleCreatePatchResponse
)

router = APIRouter()


@router.post(
    "/{agent_id}/schedule",
    response_model=AgentScheduleCreatePatchResponse,
    status_code=http_status.HTTP_201_CREATED,
    description="Create and return an agent schedule"
)
async def create_agent_schedule(
    agent_id: int,
    data: AgentScheduleCreatePatchRequest,
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    agentScheduleCRUD: AgentScheduleCRUD = Depends(get_agent_schedule_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> AgentScheduleCreatePatchResponse:
    agent = await agentCRUD.get(agent_id=agent_id)

    new_agent_schedule = await agentScheduleCRUD.create(
        agent=agent,
        data=data,
        creator=current_account
    )

    agent_schedule = AgentScheduleCreatePatchResponse(
        input_prompt=new_agent_schedule.input_prompt,
        schedule_expression=new_agent_schedule.schedule_expression,
        schedule_expression_timezone=new_agent_schedule.schedule_expression_timezone,
        start_date=new_agent_schedule.start_date,
        end_date=new_agent_schedule.end_date,
        target_email=new_agent_schedule.target_email,
        target_number=new_agent_schedule.target_number,
        schedule_name=new_agent_schedule.name,
        created_at=new_agent_schedule.created_at,
        updated_at=new_agent_schedule.updated_at
    ) 

    return agent_schedule


@router.get(
    "/{agent_id}/schedule",
    response_model=List[AgentScheduleCreatePatchResponse],
    status_code=http_status.HTTP_200_OK,
    description="Get a list of agent schedules given agent_id"
)
async def get_agent_schedule_list(
    agent_id: int,
    agentCRUD: AgentCRUD = Depends(get_agent_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> List[AgentScheduleCreatePatchResponse]:
    agent = await agentCRUD.get(agent_id=agent_id)

    if current_account.uuid != agent.creator_id:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to access this agent's actions"
        )
    
    agent_schedules = [
        AgentScheduleCreatePatchResponse(
            input_prompt=agent_schedule.input_prompt,
            schedule_expression=agent_schedule.schedule_expression,
            schedule_expression_timezone=agent_schedule.schedule_expression_timezone,
            # start_date=agent_schedule.start_date,
            # end_date=agent_schedule.end_date,
            start_date=agent_schedule.start_date,
            end_date=agent_schedule.end_date,
            target_email=agent_schedule.target_email,
            target_number=agent_schedule.target_number,
            schedule_name=agent_schedule.name,
            created_at=agent_schedule.created_at,
            updated_at=agent_schedule.updated_at
        ) for agent_schedule in agent.agent_schedules
    ] if agent.agent_schedules != [] else []

    return agent_schedules


@router.get(
    "/{agent_id}/schedule/{schedule_name}",
    response_model=AgentScheduleCreatePatchResponse,
    status_code=http_status.HTTP_200_OK,
    description="Get details of an agent schedule given schedule_name"
)
async def get_agent_schedule_by_name(
    agent_id: int,
    schedule_name: str,
    agentScheduleCRUD: AgentScheduleCRUD = Depends(get_agent_schedule_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> AgentScheduleCreatePatchResponse:
    current_agent_schedule = await agentScheduleCRUD.get(
        schedule_name=schedule_name
    )
    if not current_agent_schedule:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Agent Schedule with given schedule_name {schedule_name}"
        )

    if current_account.uuid != current_agent_schedule.creator_id:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to access this agent schedule"
        )


    agent_schedule = AgentScheduleCreatePatchResponse(
        input_prompt=current_agent_schedule.input_prompt,
        schedule_expression=current_agent_schedule.schedule_expression,
        schedule_expression_timezone=current_agent_schedule.schedule_expression_timezone,
        start_date=current_agent_schedule.start_date,
        end_date=current_agent_schedule.end_date,
        target_email=current_agent_schedule.target_email,
        target_number=current_agent_schedule.target_number,
        schedule_name=current_agent_schedule.name,
        created_at=current_agent_schedule.created_at,
        updated_at=current_agent_schedule.updated_at
    )

    return agent_schedule


@router.patch(
    "/{agent_id}/schedule/{schedule_name}",
    response_model=AgentScheduleCreatePatchResponse,
    status_code=http_status.HTTP_200_OK,
    description="Patch agent info given agent_id"
)
async def patch_agent_by_id(
    agent_id: int,
    schedule_name: str,
    data: AgentScheduleCreatePatchRequest,
    agentScheduleCRUD: AgentScheduleCRUD = Depends(get_agent_schedule_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> AgentScheduleCreatePatchResponse:

    current_agent_schedule = await agentScheduleCRUD.get(
        schedule_name=schedule_name
    )

    if not current_agent_schedule:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Agent Schedule with given schedule_name {schedule_name}"
        )

    if current_account.uuid != current_agent_schedule.creator_id:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to access this agent schedule"
        )

    updated_agent_schedule = await agentScheduleCRUD.patch(agent_schedule=current_agent_schedule, data=data)


    agent_schedule = AgentScheduleCreatePatchResponse(
        input_prompt=updated_agent_schedule.input_prompt,
        schedule_expression=updated_agent_schedule.schedule_expression,
        schedule_expression_timezone=updated_agent_schedule.schedule_expression_timezone,
        start_date=updated_agent_schedule.start_date,
        end_date=updated_agent_schedule.end_date,
        target_email=updated_agent_schedule.target_email,
        target_number=updated_agent_schedule.target_number,
        schedule_name=updated_agent_schedule.name,
        created_at=updated_agent_schedule.created_at,
        updated_at=updated_agent_schedule.updated_at
    )

    return agent_schedule


@router.delete(
    "/{agent_id}/schedule/{schedule_name}",
    response_model=StatusMessage,
    status_code=http_status.HTTP_200_OK,
    description="Delete an agent given agent_id"
)
async def delete_agent_by_id(
    agent_id: int,
    schedule_name: str,
    agentScheduleCRUD: AgentScheduleCRUD = Depends(get_agent_schedule_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> StatusMessage:
    current_agent_schedule = await agentScheduleCRUD.get(
        schedule_name=schedule_name
    )

    if not current_agent_schedule:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Agent Schedule with given schedule_name {schedule_name}"
        )

    if current_account.uuid != current_agent_schedule.creator_id:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to access this agent schedule"
        )

    message = await agentScheduleCRUD.delete(agent_schedule=current_agent_schedule)

    return {"status": True, "message": message}
