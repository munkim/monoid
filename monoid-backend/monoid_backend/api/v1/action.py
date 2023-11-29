from typing import Any, List, Tuple
from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status

from monoid_backend.api import helpers
from monoid_backend.api.v1.api_models.status_message import StatusMessage
from monoid_backend.crud.agent_crud import AgentCRUD, get_agent_crud
from monoid_backend.crud.account_crud import AccountCRUD, get_account_crud
from monoid_backend.crud.action_crud import ActionCRUD, get_action_crud
from monoid_backend.db_models.account import Account
from monoid_backend.api.v1.api_models.action import (
    ActionCategory,
    ActionCategoryCreateOrPatchRequest,
    ActionCategoryReadResponse,
    ActionCategoryListReadResponse
)

router = APIRouter()


@router.get(
    "/category",
    response_model=ActionCategoryListReadResponse,
    status_code=http_status.HTTP_200_OK,
    description="Get a list of Action Categories"
)
async def get_category_list(
    actionCRUD: ActionCRUD = Depends(get_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ActionCategoryListReadResponse:

    action_categories = await actionCRUD.get_category_list()

    action_categories_response = ActionCategoryListReadResponse(
        action_category_list = [ActionCategoryReadResponse(
            action_id=action_category.id,
            name=action_category.name,
            description=action_category.description
        ) for action_category in action_categories]
    )

    return action_categories_response


@router.post(
    "/category",
    response_model=ActionCategoryReadResponse,
    status_code=http_status.HTTP_201_CREATED,
    description="Create Action Category"
)
async def create_action_category(
    data: ActionCategoryCreateOrPatchRequest,
    actionCRUD: ActionCRUD = Depends(get_action_crud),
    current_account: Account = Depends(helpers.get_current_account) 
) -> ActionCategoryReadResponse:
    # TODO: Add a check to see if the category already exists

    action_category = await actionCRUD.create_category(data=data)

    # TODO: Add a check if the user is allowed to create a category (i.e. if they are an Monoid Admin)

    action_category_response = ActionCategoryReadResponse(
        action_id=action_category.id,
        name=action_category.name,
        description=action_category.description
    )

    return action_category_response

