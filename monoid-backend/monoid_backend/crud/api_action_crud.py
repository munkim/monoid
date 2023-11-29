from uuid import UUID
from datetime import datetime
from typing import Any, List, Tuple

from fastapi import Depends, HTTPException
from fastapi import status as http_status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from monoid_backend.core.database import get_async_session
from monoid_backend.db_models.account import Account
from monoid_backend.db_models.action import ActionCategory
from monoid_backend.db_models.api_action import APIAction
from monoid_backend.api.v1.api_models.api_action import ActionCreateRequest, ActionPatchRequest
from monoid_backend.monoid.action.api_action_config import parse_api_action


class APIActionCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    #===============================================================================
    # BASIC API / Action CRUD
    #===============================================================================

    async def create(self, data: ActionCreateRequest, creator: Account) -> APIAction:
        # Parse the action to get the calculated fields
        api_config, user_configurables, function_call_keys_to_paths, function_call_config = await parse_api_action(
            data.action_info.snake_case_name,
            data.action_info.description,
            data.api_info.method,
            data.api_info.template_url,
            data.api_info.headers,
            data.api_info.path_parameters,
            data.api_info.query_parameters,
            data.api_info.body,
        )

        # Create a record for an Action 
        action = APIAction(
            name = data.action_info.name,
            creator_id = creator.uuid,
            snake_case_name = data.action_info.snake_case_name,
            description = data.action_info.description,
            is_public = data.action_info.is_public,
            followup_prompt= data.action_info.followup_prompt,
            is_user_confirmation_needed = data.action_info.is_user_confirmation_needed,
            is_admin_approval_needed = data.action_info.is_admin_approval_needed,

            method = data.api_info.method,
            template_url = data.api_info.template_url,
            headers = data.api_info.headers.model_dump(),
            path_parameters = data.api_info.path_parameters.model_dump(),
            query_parameters = data.api_info.query_parameters.model_dump(),
            body = data.api_info.body.model_dump(),

            api_config = api_config.model_dump(),
            user_configurables = user_configurables.model_dump(),
            function_call_keys_to_paths = function_call_keys_to_paths.model_dump(),
            function_call_config = function_call_config.model_dump(),
        )
        action.creator = creator

        # Associate the action with the categories
        statement = select(
            ActionCategory
        ).where(
            ActionCategory.id.in_(data.category_ids)
        )
        results = await self.session.scalars(statement=statement)
        categories = results.all()
        action.categories = categories # type: List[ActionCategory] | None

        self.session.add(action)

        # Commit all changes  
        await self.session.commit()

        # Refresh the action object to get the updated values (i.e. updated_at, etc.) for all other processes
        await self.session.refresh(action)

        return action


    async def get(self, action_id: int) -> APIAction:
        statement = select(
            APIAction
        ).where(
            APIAction.id == action_id
        )
        results = await self.session.execute(statement=statement)
        func = results.scalar_one_or_none() # type: APIAction | None
        
        return func


    async def patch(self, action: APIAction, data: ActionPatchRequest) -> APIAction:

        action_info = data.action_info
        api_info = data.api_info

        api_info_dict = api_info.model_dump(exclude_unset=True)
        action_info_dict = action_info.model_dump(exclude_unset=True)

        # Update the action
        for key, value in action_info_dict.items():
            setattr(action, key, value)
        
        # If the api_info is not empty, then parse action again and update calculated_fields
        # calculated fields include api_config, user_configurables, function_call_keys_to_path, function_call_config
        if api_info_dict or action_info_dict:
            api_config, user_configurables, function_call_keys_to_paths, function_call_config = await parse_api_action(
                action_info.snake_case_name,
                action_info.description,
                api_info.method,
                api_info.template_url,
                api_info.headers,
                api_info.path_parameters,
                api_info.query_parameters,
                api_info.body,
            )
            action.api_config = api_config.model_dump()
            action.user_configurables = user_configurables.model_dump()
            action.function_call_keys_to_paths = function_call_keys_to_paths.model_dump()
            action.function_call_config = function_call_config.model_dump()

        # Update the api_info
        for key, value in api_info_dict.items():
            setattr(action, key, value)
        
        if data.category_ids:
            statement = select(
                ActionCategory
            ).where(
                ActionCategory.id.in_(data.category_ids)
            )
            results = await self.session.execute(statement=statement)
            categories = results.scalars().all()
            action.categories = categories

        await self.session.commit()
        await self.session.refresh(action)

        return action


    async def delete(self, action: int) -> bool:
        await self.session.delete(action)
        await self.session.commit()

        return True
    
    #===============================================================================
    # User & Category Read / Write
    #===============================================================================

    async def get_actions_by_account_uuid(self, account_uuid: UUID) -> List[APIAction]:
        statement = select(
            APIAction
        ).where(
            APIAction.creator_id == account_uuid
        )

        actions = await self.session.scalars(statement=statement)

        return actions
    
    async def get_actions_by_category_id(self, category_id: int) -> List[APIAction]:
        statement = select(
            ActionCategory
        ).where(
            ActionCategory.id == int(category_id)
        )

        result = await self.session.execute(statement=statement)
        action_category = result.scalar_one_or_none() # type: ActionCategory | None
        actions = action_category.api_actions

        return actions


async def get_api_action_crud(
    session: AsyncSession = Depends(get_async_session)
) -> APIActionCRUD:
    return APIActionCRUD(session=session)
