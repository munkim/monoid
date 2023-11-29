import os
import uuid
import json
import boto3
from typing import List, Optional

from monoid_backend.db_models.agent import Agent, AgentSchedule
from monoid_backend.config import settings

eventbridge_client = boto3.client('scheduler')


def get_apigateway_proxy_json(
    input_prompt: str,
    agent_id: int,
    encoded_agent_config: str
):
    apigateway_proxy_json = {
        "version": "2.0",
        "routeKey": "POST /v1/chat-session/message",
        "rawPath": "/v1/chat-session/message",
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
                "path": "/v1/chat-session/message",
                "protocol": "HTTP/1.1",
                "sourceIp": "IP",
                "userAgent": "agent"
            }
        },
        "body": json.dumps({
            "chat_session_uuid": str(uuid.uuid4()),
            "content": input_prompt,
            "agent_id": agent_id,
            "encoded_agent_config": encoded_agent_config,
            "is_scheduled": True
        })
    }
    return apigateway_proxy_json



def create_eventbridge_schedule(
    name: str,
    input_prompt: str,
    agent_id: str,
    encoded_agent_config: str,
    schedule_expression: str,
    schedule_expression_timezone: str
) -> str:

    # Create a schedule in AWS EventBridge
    response = eventbridge_client.create_schedule(
        Name=name,
        Description='Monoid Agent Schedule for Agent ({agent_id}) and Account ({account_uuid})',
        ScheduleExpression=schedule_expression,
        ScheduleExpressionTimezone=schedule_expression_timezone,
        State='ENABLED',
        FlexibleTimeWindow = {
            'Mode': 'OFF'
        },
        Target = {
            'Arn': os.environ.get('LAMBDA_FUNCTION_INVOKE_ARN'),
            'Input': json.dumps(get_apigateway_proxy_json(input_prompt, agent_id, encoded_agent_config)),
            'RoleArn': os.environ.get('MONOID_AWS_EVENTBRIDGE_ROLE_ARN')
        }
    )

    return response['ScheduleArn']


def update_eventbridge_schedule(
    name: str,
    input_prompt: str,
    agent_id: str,
    encoded_agent_config: str,
    schedule_expression: str,
    schedule_expression_timezone: str
) -> str:
    
    existing_schedule = eventbridge_client.get_schedule(
        Name=name
    )

    if not existing_schedule:
        raise Exception(f'No schedule found with name: {name}')

    # Update a schedule in AWS EventBridge
    response = eventbridge_client.update_schedule(
        Name=name,
        Description=existing_schedule.get('Description'),
        ScheduleExpression=schedule_expression,
        ScheduleExpressionTimezone=schedule_expression_timezone,
        State='ENABLED',
        FlexibleTimeWindow = {
            'Mode': 'OFF'
        },
        Target = {
            'Arn': existing_schedule.get('Target').get('Arn'),
            'Input': json.dumps(get_apigateway_proxy_json(input_prompt, agent_id, encoded_agent_config)),
            'RoleArn': existing_schedule.get('Target').get('RoleArn')
        }
    )

    return response['ScheduleArn']


def delete_eventbridge_schedule(
    name: str,
) -> str:
    
    existing_schedule = eventbridge_client.get_schedule(
        Name=name
    )

    if not existing_schedule:
        raise Exception(f'No schedule found with name: {name}')

    # Update a schedule in AWS EventBridge
    response = eventbridge_client.delete_schedule(
        Name=name,
    )

    return response == {}