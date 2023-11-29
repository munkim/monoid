from uuid import UUID
from datetime import datetime
from typing import Any, List, Tuple

from fastapi import Depends, HTTPException
from fastapi import status as http_status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from monoid_backend.core.database import get_async_session
from monoid_backend.db_models.account import Account
from monoid_backend.db_models.action import ActionCategory
from monoid_backend.api.v1.api_models.action import ActionCategoryCreateOrPatchRequest


class ActionCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session
    

    async def create_category(self, data: ActionCategoryCreateOrPatchRequest) -> ActionCategory:
        # Create a record for an Action 
        category = ActionCategory(
            name = data.name,
            description = data.description
        )

        self.session.add(category)

        # Commit all changes  
        await self.session.commit()

        # Refresh the action object to get the updated values (i.e. updated_at, etc.) for all other processes
        await self.session.refresh(category)

        return category


    async def get_category_list(self) -> List[ActionCategory]:
        statement = select(ActionCategory)
        result = await self.session.scalars(statement) # type: List[ActionCategory] | None
        all_categories = result.all()
        return all_categories


    async def delete(self, action: int) -> bool:
        await self.session.delete(action)
        await self.session.commit()

        return True
    


async def get_action_crud(
    session: AsyncSession = Depends(get_async_session)
) -> ActionCRUD:
    return ActionCRUD(session=session)
