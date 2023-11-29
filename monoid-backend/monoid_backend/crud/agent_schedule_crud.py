import os
import json
import uuid
from uuid import UUID
from datetime import datetime
from typing import Any, List, Dict, Tuple
from jsonschema import validate
from botocore import errorfactory

import boto3
from fastapi import Depends, HTTPException
from fastapi import status as http_status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from monoid_backend.db_models.account import Account
from monoid_backend.db_models.agent import Agent, AgentSchedule
from monoid_backend.api.v1.api_models.agent_schedule import AgentScheduleCreatePatchRequest
from monoid_backend.core.database import get_async_session
from monoid_backend.config import settings

eventbridge_client = boto3.client('scheduler')

def get_apigateway_proxy_json(
    input_prompt: str,
    agent_id: int
):
    apigateway_proxy_json = {
        "version": "2.0",
        "routeKey": "POST /v1/chat-session/scheduled-message",
        "rawPath": "/v1/chat-session/scheduled-message",
        "headers": {
            "Accept": "*/*",
            "Host": f"{settings.AWS_ACCOUNT_ID}.execute-api.us-east-1.amazonaws.com",
            "User-Agent": "Custom User Agent String",
            "X-Amz-Cf-Id": "cDehVQoZnx43VYQb9j2-nvCh-9z396Uhbp027Y2JvkCPNLmGJHqlaA==",
            "X-Forwarded-For": "127.0.0.1",
            "X-Forwarded-Port": "443",
            "X-Forwarded-Proto": "https"
        },
        "requestContext": {
            "http": {
                "method": "POST",
                "path": "/v1/chat-session/scheduled-message",
                "protocol": "HTTP/1.1",
                "sourceIp": "IP",
                "userAgent": "agent"
            }
        },
        "body": json.dumps({
            "content": input_prompt,
            "agent_id": agent_id
        })
    }
    return apigateway_proxy_json


class AgentScheduleCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session


    async def get(self, schedule_name: str) -> AgentSchedule:
        statement = select(
            AgentSchedule
        ).where(
            AgentSchedule.name == schedule_name
        )
        results = await self.session.scalars(statement=statement)
        agent_schedule = results.unique().one_or_none() # type: AgentSchedule | None

        # if agent_schedule is None:
        #     raise HTTPException(
        #         status_code=http_status.HTTP_404_NOT_FOUND,
        #         detail="Agent schedule not found!"
        #     )

        return agent_schedule
   
    
    async def get_schedules_by_agent_id(self, agent_id: int) -> List[AgentSchedule]:
        statement = select(
            AgentSchedule
        ).where(
            AgentSchedule.agent_id == agent_id
        )
        schedules = await self.session.scalars(statement=statement)

        return schedules


    async def create(
        self, 
        agent: Agent, 
        data: AgentScheduleCreatePatchRequest,
        creator: Account
    ) -> AgentSchedule:
        created_at = datetime.now()
        creation_time = created_at.strftime('%Y%m%d-%H%M%S')
        subdomain = agent.url.split(".")[0]
        schedule_name = f"{subdomain}--{creation_time}"

        # Create dynamic dates object since StartDate and EndDate in eventbridge api cannot be None (although they are optional)
        dates =  {}
        if data.start_date: 
            dates['StartDate'] = data.start_date
        if data.end_date:
            dates['EndDate'] = data.end_date

        # Create a schedule in AWS EventBridge
        response = eventbridge_client.create_schedule(
            Name=schedule_name,
            Description='Monoid Agent Schedule for Agent ({agent_id}) and Account ({account_uuid})',
            ScheduleExpression=data.schedule_expression,
            ScheduleExpressionTimezone=data.schedule_expression_timezone,
            State='ENABLED',
            FlexibleTimeWindow = {
                'Mode': 'OFF'
            },
            Target = {
                'Arn': os.environ.get('LAMBDA_FUNCTION_INVOKE_ARN'),
                'Input': json.dumps(get_apigateway_proxy_json(data.input_prompt, agent.id)),
                'RoleArn': os.environ.get('MONOID_AWS_EVENTBRIDGE_ROLE_ARN')
            },
            **dates
        )

        schedule = AgentSchedule(
            agent_id = agent.id,
            creator_id = creator.uuid,
            target_email = data.target_email,
            target_number = data.target_number,
            group_name = "default",
            name = schedule_name,
            aws_schedule_arn = response["ScheduleArn"],
            input_prompt = data.input_prompt,
            start_date = data.start_date,
            end_date = data.end_date,
            schedule_expression = data.schedule_expression,
            schedule_expression_timezone = data.schedule_expression_timezone,
            created_at = created_at
        )

        schedule.agent = agent
        agent.agent_schedules += [schedule]
        self.session.add(schedule)

        await self.session.commit()

        return schedule


    async def patch(
        self, 
        agent_schedule: AgentSchedule,
        data: AgentScheduleCreatePatchRequest
    ) -> AgentSchedule:

        try: 
            # Fetch the schedule 
            existing_schedule = eventbridge_client.get_schedule(
                Name=agent_schedule.name
            )
        except eventbridge_client.exceptions.ResourceNotFoundException:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Cannot find Agent Schedule with given schedule_name {agent_schedule.name}"
            )

        # Create dynamic dates object since StartDate and EndDate in eventbridge api cannot be None (although they are optional)
        # Currenly, if they are not provided in a payload, they will be removed from the schedule;
        # Ex) if start_date is not provided, StartDate will be removed from the schedule
        dates =  {}
        if data.start_date: 
            dates['StartDate'] = data.start_date
        if data.end_date:
            dates['EndDate'] = data.end_date

        # Update a schedule in AWS EventBridge
        response = eventbridge_client.update_schedule(Name=agent_schedule.name,
            Description=existing_schedule.get('Description'),
            ScheduleExpression=data.schedule_expression,
            ScheduleExpressionTimezone=data.schedule_expression_timezone,
            State='ENABLED',
            FlexibleTimeWindow = {
                'Mode': 'OFF'
            },
            Target = {
                'Arn': existing_schedule.get('Target').get('Arn'),
                'Input': json.dumps(get_apigateway_proxy_json(data.input_prompt, agent_schedule.agent_id)),
                'RoleArn': existing_schedule.get('Target').get('RoleArn')
            },
            **dates
        )

        # Update a schedule in the database
        values = data.model_dump(exclude_unset=True)
        for k, v in values.items():
            setattr(agent_schedule, k, v)
        
        setattr(agent_schedule, "aws_schedule_arn", response["ScheduleArn"])
        self.session.add(agent_schedule)

        await self.session.commit()
        await self.session.refresh(agent_schedule)

        return agent_schedule
    

    async def delete(self, agent_schedule: AgentSchedule) -> None:
        
        await self.session.delete(agent_schedule)
        await self.session.commit()
        
        try: 
            response = eventbridge_client.delete_schedule(
                Name=agent_schedule.name,
            )
            message = "Successfully deleted the schedule."
        except eventbridge_client.exceptions.ResourceNotFoundException:
            message = "Schedule did not exist, but successfully deleted from database."

        return message

    

async def get_agent_schedule_crud(
    session: AsyncSession = Depends(get_async_session)
) -> AgentScheduleCRUD:
    return AgentScheduleCRUD(session=session)
