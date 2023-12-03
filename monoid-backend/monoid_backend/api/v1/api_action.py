import httpx
import time
from urllib.parse import urlencode
import traceback
from sentry_sdk import capture_exception
from typing import Any, List, Dict, Tuple, Union
from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status
from fastapi.responses import StreamingResponse
import aiohttp

from monoid_backend.api import helpers
from monoid_backend.api.v1.api_models.status_message import StatusMessage
from monoid_backend.crud.agent_crud import AgentCRUD, get_agent_crud
from monoid_backend.crud.account_crud import AccountCRUD, get_account_crud
from monoid_backend.db_models.account import Account
from monoid_backend.crud.api_action_crud import APIActionCRUD, get_api_action_crud
from monoid_backend.monoid.action.action_config_model import APIActionParameters, APIActionParameter
from monoid_backend.api.v1.api_models.action import ActionCategory
from monoid_backend.api.v1.api_models.api_action import (
    ActionCreateRequest,
    ActionPatchRequest,
    ActionInfo,
    APIInfo,
    ActionBasicListReadResponse,
    UserConfigurableResponse,
    ActionDetailedReadResponse,
    APITestingResponse,
    ActionTestingResponse,
    APITest,
    ActionTest
)
from monoid_backend.monoid.action.api_action_config import parse_api_action, run_action, run_action_stream

router = APIRouter()

#===============================================================================
# BASIC API / Action CRUD
#===============================================================================

@router.post(
    "",
    response_model=ActionDetailedReadResponse,
    status_code=http_status.HTTP_201_CREATED,
    description="Create and return Action (aka function)"
)
async def create_api(
    data: ActionCreateRequest,
    actionCRUD: APIActionCRUD = Depends(get_api_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ActionDetailedReadResponse:
    action = await actionCRUD.create(data=data, creator=current_account)

    action_response = ActionDetailedReadResponse(
        action_id=action.id,
        creator_id=action.creator_id,
        categories=[
            ActionCategory(
                category_id=category.id,
                name=category.name,
                description=category.description
            ) for category in action.categories
        ],
        action_info=ActionInfo(
            name=action.name,
            snake_case_name=action.snake_case_name,
            description=action.description,
            followup_prompt=action.followup_prompt,
            is_user_confirmation_needed=action.is_user_confirmation_needed,
            is_admin_approval_needed=action.is_admin_approval_needed,
            is_public=action.is_public
        ),
        api_info=APIInfo(
            method=action.method,
            template_url=action.template_url,
            headers=APIActionParameters.model_validate(action.headers),
            path_parameters=APIActionParameters.model_validate(action.path_parameters),
            query_parameters=APIActionParameters.model_validate(action.query_parameters),
            body=APIActionParameters.model_validate(action.body),
        ),
        is_editable=True
    )
    
    return action_response


@router.get(
    "/{action_id}",
    response_model=ActionDetailedReadResponse,
    status_code=http_status.HTTP_200_OK,
    description="Get details about the Action given action_id"
)
async def get_agent_details_by_id(
    action_id: int,
    actionCRUD: APIActionCRUD = Depends(get_api_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ActionDetailedReadResponse:
    action = await actionCRUD.get(action_id=action_id)

    if not action:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Action with id {action_id}"
        )

    action_response = ActionDetailedReadResponse(
        action_id=action.id,
        creator_id=action.creator_id,
        categories=[
            ActionCategory(
                category_id=category.id,
                name=category.name,
                description=category.description
            ) for category in action.categories
        ],
        action_info=ActionInfo(
            name=action.name,
            snake_case_name=action.snake_case_name,
            description=action.description,
            followup_prompt=action.followup_prompt,
            is_user_confirmation_needed=action.is_user_confirmation_needed,
            is_admin_approval_needed=action.is_admin_approval_needed,
            is_public=action.is_public
        ),
        api_info=APIInfo(
            method=action.method,
            template_url=action.template_url,
            headers=APIActionParameters.model_validate(action.headers),
            path_parameters=APIActionParameters.model_validate(action.path_parameters),
            query_parameters=APIActionParameters.model_validate(action.query_parameters),
            body=APIActionParameters.model_validate(action.body),
        ),
        is_editable=current_account.uuid == action.creator_id
    )

    return action_response


@router.get(
    "/{action_id}/user-configurables",
    response_model=UserConfigurableResponse,
    status_code=http_status.HTTP_200_OK,
    description="Get basics about the Action given action_id"
)
async def get_agent_details_by_id(
    action_id: int,
    actionCRUD: APIActionCRUD = Depends(get_api_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> UserConfigurableResponse:
    action = await actionCRUD.get(action_id=action_id)
    
    if not action:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Action with id {action_id}"
        )
    
    user_configurable_response = UserConfigurableResponse(
        action_id=action.id,
        creator_id=action.creator_id,
        name=action.name,
        snake_case_name=action.snake_case_name,
        description=action.description,
        is_public=action.is_public,

        user_configurable_parameters=action.user_configurables,
        is_user_confirmation_needed=action.is_user_confirmation_needed,
        is_admin_approval_needed=action.is_admin_approval_needed,
    )

    return user_configurable_response


@router.patch(
    "/{action_id}",
    response_model=ActionDetailedReadResponse,
    status_code=http_status.HTTP_200_OK,
    description="Patch Action info given action_id"
)
async def patch_action_by_id(
    action_id: int,
    data: ActionPatchRequest,
    actionCRUD: APIActionCRUD = Depends(get_api_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ActionDetailedReadResponse:
    action = await actionCRUD.get(action_id=action_id)

    if not action:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Action with id {action_id}"
        )
        

    if current_account.uuid != action.creator_id:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to modify this Action"
        )
    
    patched_action = await actionCRUD.patch(action=action, data=data)

    action_response = ActionDetailedReadResponse(
        action_id=patched_action.id,
        creator_id=patched_action.creator_id,
        categories=[
            ActionCategory(
                category_id=category.id,
                name=category.name,
                description=category.description
            ) for category in patched_action.categories
        ],
        action_info=ActionInfo(
            name=patched_action.name,
            snake_case_name=patched_action.snake_case_name,
            description=patched_action.description,
            followup_prompt=patched_action.followup_prompt,
            is_user_confirmation_needed=patched_action.is_user_confirmation_needed,
            is_admin_approval_needed=patched_action.is_admin_approval_needed,
            is_public=patched_action.is_public
        ),
        api_info=APIInfo(
            method=patched_action.method,
            template_url=patched_action.template_url,
            headers=APIActionParameters.model_validate(patched_action.headers),
            path_parameters=APIActionParameters.model_validate(patched_action.path_parameters),
            query_parameters=APIActionParameters.model_validate(patched_action.query_parameters),
            body=APIActionParameters.model_validate(patched_action.body),
        ),
        is_editable=True
    )

    return action_response


@router.delete(
    "/{action_id}",
    response_model=StatusMessage,
    status_code=http_status.HTTP_200_OK,
    description="Delete Action given action_id"
)
async def delete_agent_by_id(
    action_id: int,
    actionCRUD: APIActionCRUD = Depends(get_api_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> StatusMessage:
    action = await actionCRUD.get(action_id=action_id)

    if not action:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Action with id {action_id}"
        )

    if current_account.uuid != action.creator_id:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to modify this Action"
        )
    status = await actionCRUD.delete(action=action)

    return {"status": status, "message": "The Action has been deleted!"}



#===============================================================================
# User Read / Write
#===============================================================================
@router.get(
    "/list/account",
    response_model=ActionBasicListReadResponse,
    status_code=http_status.HTTP_200_OK,
    description="Get a list of Actions (and their basic info) that the current account owns"
)
async def get_action_list_by_account_id(
    actionCRUD: APIActionCRUD = Depends(get_api_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ActionBasicListReadResponse:
    actions = await actionCRUD.get_actions_by_account_uuid(account_uuid=current_account.uuid)

    if actions is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find any Actions created by account with uuid {current_account.uuid}"
        )

    action_base_list = ActionBasicListReadResponse(
        action_info_list=[ActionInfo(
            action_id=action.id,
            name=action.name,
            snake_case_name=action.snake_case_name,
            description=action.description,
            followup_prompt=action.followup_prompt,
            is_user_confirmation_needed=action.is_user_confirmation_needed,
            is_admin_approval_needed=action.is_admin_approval_needed,
            is_public=action.is_public
        ) for action in actions]
    )

    return action_base_list


#===============================================================================
# Category Read / Write
#===============================================================================


@router.get(
    "/category/{category_id}",
    response_model=ActionBasicListReadResponse,
    status_code=http_status.HTTP_200_OK,
    description="Get a list of Actions (and their basic info) that the current account has access to as a creator"
)
async def get_action_list_by_category_id(
    category_id: str,
    actionCRUD: APIActionCRUD = Depends(get_api_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ActionBasicListReadResponse:
    actions = await actionCRUD.get_actions_by_category_id(category_id=category_id)

    if actions is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find any Actions with category id {category_id}"
        )
    
    action_base_list = ActionBasicListReadResponse(
        action_info_list=[ActionInfo(
            action_id=action.id,
            name=action.name,
            snake_case_name=action.snake_case_name,
            description=action.description,
            followup_prompt=action.followup_prompt,
            is_user_confirmation_needed=action.is_user_confirmation_needed,
            is_admin_approval_needed=action.is_admin_approval_needed,
            is_public=action.is_public
        ) for action in actions if action.is_public or action.creator_id == current_account.uuid]
    )

    return action_base_list


#===============================================================================
# API / Action Testing
#===============================================================================
@router.post(
    "/api-test",
    response_model=APITestingResponse,
    status_code=http_status.HTTP_201_CREATED,
)
async def test_api(
    api_test: APITest,
    actionCRUD: APIActionCRUD = Depends(get_api_action_crud),
    current_account: Account = Depends(helpers.get_current_account)
) -> APITestingResponse:
    # TODO: Add pager duty for this API testing and wrap them in TRY-EXCEPT

    action = await actionCRUD.get(action_id=api_test.action_id)

    if not action:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Action with id {api_test.action_id}"
        )


    method = action.method
    url = action.template_url
    headers = APIActionParameters.model_validate(action.headers).root
    query_parameters = APIActionParameters.model_validate(action.query_parameters).root
    path_parameters = APIActionParameters.model_validate(action.path_parameters).root
    body = APIActionParameters.model_validate(action.body).root

    # If url is None, raise an error
    if not url:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"The URL for Action ({api_test.action_id}) is empty"
        )

    # ====================================
    # Parse and Replace Path Parameters
    # ====================================
    # Replace path parameters in the URL
    for key, path_param in path_parameters.items():
        url = url.replace(f'{{{path_param.key}}}', str(path_param.value))
    
    # ===========================
    # Parsing Headers
    # ===========================
    request_headers = {header.key: header.value for _, header in headers.items()}
    
    # =============================================
    # Parse and Append Query Parameters to URL
    # =============================================
    query_params = {query_param.key: query_param.value for _, query_param in query_parameters.items()}
    query_string = urlencode(query_params)
    if query_string:
        url = f"{url}?{query_string}"
    
    # ===========================
    # Parsing Body Parameters
    # ===========================
    # Helper function
    def deep_update_dict(data: dict, sub_dict: Union[APIActionParameters, APIActionParameter]):
        if isinstance(sub_dict, APIActionParameter):
            return sub_dict.value
        elif isinstance(sub_dict, APIActionParameters):
            for key, obj in sub_dict.root.items():
                data[key] = deep_update_dict(data.get(key, {}), obj)

        return data

    # Parse body parameter into data
    data = {}
    
    for key, obj in body.items():
        if isinstance(obj, APIActionParameter):
            data[key] = obj.value
        elif isinstance(obj, APIActionParameters):
            data[key] = deep_update_dict(data.get(key, {}), obj)
        else:
            # Here you may define how you want to handle list data
            pass

    # ===========================
    # Make API call
    # ===========================
    async with aiohttp.ClientSession() as session:
        try: 
            start_time = time.time()
            async with session.request(method, url, headers=request_headers, json=data) as response:
                # Check status code
                response_body = await response.text()

                if 'Content-Length' in response.headers:
                    content_length = int(response.headers['Content-Length'])
                else:
                    content_length = len(response_body)

                end_time = time.time()
                duration = round(end_time - start_time, 2)
                if 200 <= response.status < 300: # or 'application/json' in response.headers.get('Content-Type', ''):
                    # Try parsing JSON
                    return APITestingResponse(
                        status_code=response.status, 
                        response=await response.json(),
                        time_taken=duration,
                        response_size=content_length
                    )
                elif response.status == 404:
                    return APITestingResponse(
                        status_code=http_status.HTTP_404_NOT_FOUND, 
                        response=f"404: API endpoint {url} does not exist.",
                        time_taken=duration,
                        response_size=content_length
                    )
                elif response.status == 500:
                    return APITestingResponse(
                        status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, 
                        response=f"500: The API ({url}) had an Internal Server Error: \n{response_body}",
                        time_taken=duration,
                        response_size=content_length
                    )
                else:
                    return APITestingResponse(
                        status_code=response.status, 
                        response=response_body,
                        time_taken=duration,
                        response_size=content_length
                    )

        except Exception as e:
            capture_exception(traceback.print_exc())
            return APITestingResponse(
                status_code=http_status.HTTP_400_BAD_REQUEST, 
                response="Invalid API Call\n" + str(repr(e)),
                time_taken=-1,
                response_size=-1
            )


@router.post(
    "/action-test",
    response_model=ActionTestingResponse,
    status_code=http_status.HTTP_201_CREATED,
)
async def test_api(
    action_body: ActionTest,
    actionCRUD: APIActionCRUD = Depends(get_api_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ActionTestingResponse:
    # TODO: Add pager duty for this API testing and wrap them in TRY-EXCEPT

    action = await actionCRUD.get(action_id=action_body.action_id)

    if not action:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Action with id {action_body.action_id}"
        )

    method = action.method
    template_url = action.template_url
    headers = APIActionParameters.model_validate(action.headers)
    query_parameters = APIActionParameters.model_validate(action.query_parameters)
    path_parameters = APIActionParameters.model_validate(action.path_parameters)
    body = APIActionParameters.model_validate(action.body)

    # Action related parameters
    action_name = action.name
    action_description = action.description
    action_followup_prompt = action.followup_prompt
    action_is_user_confirmation_needed = action.is_user_confirmation_needed
    action_is_admin_approval_needed = action.is_admin_approval_needed

    # If url is None, raise an error
    if not template_url:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"The Template URL for Action ({action_body.action_id}) is empty"
        )
    
    # Basic 
    api_config, user_configurables, function_call_key_paths, function_call_config = await parse_api_action(
        action_name,
        action_description,
        method,
        template_url,
        headers,
        query_parameters,
        path_parameters,
        body
    )

    start_time = time.time()
    language_response, new_messages = await run_action(
        action_body.user_message,
        action_followup_prompt,
        api_config,
        function_call_key_paths,
        function_call_config
    )
    end_time = time.time()
    duration = round(end_time - start_time, 2)

    return ActionTestingResponse(
        api_status=200,
        response=language_response,
        time_taken=duration,
    )

@router.post(
    "/action-test-stream",
    status_code=http_status.HTTP_201_CREATED,
)
async def test_api(
    action_body: ActionTest,
    actionCRUD: APIActionCRUD = Depends(get_api_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ActionTestingResponse:
    # TODO: Add pager duty for this API testing and wrap them in TRY-EXCEPT

    action = await actionCRUD.get(action_id=action_body.action_id)

    if not action:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Cannot find Action with id {action_body.action_id}"
        )

    method = action.method
    template_url = action.template_url
    headers = APIActionParameters.model_validate(action.headers)
    query_parameters = APIActionParameters.model_validate(action.query_parameters)
    path_parameters = APIActionParameters.model_validate(action.path_parameters)
    body = APIActionParameters.model_validate(action.body)

    # Action related parameters
    action_name = action.name
    action_snake_case_name = action.snake_case_name
    action_description = action.description
    action_followup_prompt = action.followup_prompt
    action_is_user_confirmation_needed = action.is_user_confirmation_needed
    action_is_admin_approval_needed = action.is_admin_approval_needed

    # If url is None, raise an error
    if not template_url:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"The Template URL for Action ({action_body.action_id}) is empty"
        )
    
    # Basic 
    api_config, user_configurables, function_call_key_paths, function_call_config = await parse_api_action(
        action_snake_case_name,
        action_description,
        method,
        template_url,
        headers,
        query_parameters,
        path_parameters,
        body
    )

    # Emulate OpenAI's response in word-by-word 
    return StreamingResponse(
        run_action_stream(
            action_body.user_message,
            action_followup_prompt,
            api_config,
            function_call_key_paths,
            function_call_config
        ),
        media_type="text/event-stream"
    )