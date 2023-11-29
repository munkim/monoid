import os
from uuid import UUID
from datetime import datetime
from typing import Any, List, Dict, Tuple
from jsonschema import validate

from fastapi import Depends, HTTPException
from fastapi import status as http_status
from sqlalchemy import delete, select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import lazyload, selectinload

from monoid_backend.db_models.account import Account
from monoid_backend.db_models.agent import Agent
from monoid_backend.db_models.action import ActionCategory
from monoid_backend.api.v1.api_models.agent import AgentCreateRequest, AgentPatchRequest
from monoid_backend.core.database import get_async_session
from monoid_backend.monoid.action.action_config_model import AgentConfig

class AgentCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: AgentCreateRequest, url: str, creator: Account) -> Agent:
        initial_agent_config = AgentConfig(
            agent_name = data.name,
            agent_description = data.description,
            agent_type = data.agent_type,
            llm_option = data.llm_option,
            llm_api_key = data.llm_api_key,
        )
        # Create a record for an Agent 
        agent = Agent(
            name = data.name,
            snake_case_name = data.snake_case_name,
            description = data.description,
            instructions = data.instructions,
            slug = data.slug,
            url = url,
            agent_type = data.agent_type,
            creator_id = creator.uuid,
            is_public = data.is_public,
            agent_config = initial_agent_config.model_dump(),
            llm_option = data.llm_option,
            llm_api_key = data.llm_api_key,
        )
        agent.creator = creator

        # Associate the agent with categories
        if data.category_ids:
            statement = select(
                ActionCategory
            ).where(
                ActionCategory.id.in_(data.category_ids)
            )
            results = await self.session.scalars(statement=statement)
            categories = results.all()
            agent.categories = categories # type: List[ActionCategory] | None

        # Commit all changes
        self.session.add(agent)
        await self.session.commit()

        # Refresh the agent object to get the updated values (i.e. updated_at, etc.) for all other processes
        await self.session.refresh(agent)

        return agent


    async def get_agents_by_account_uuid(self, account_uuid: UUID) -> List[Agent]:
        statement = select(
            Agent
        ).where(
            Agent.creator_id == account_uuid
        )
        
        agents = await self.session.scalars(statement=statement) # type: List[Agent] | None

        return agents


    async def get(self, agent_id: int) -> Agent:
        statement = select(
            Agent
        ).where(
            Agent.id == agent_id
        ).options(
            selectinload(Agent.configured_actions),
            selectinload(Agent.agent_schedules),
            selectinload(Agent.expert_agents),
        )

        results = await self.session.scalars(statement=statement)
        agent = results.unique().one_or_none() # type: Agent | None

        return agent


    async def get_agent_by_url(self, url: int) -> Agent:
        statement = select(
            Agent
        ).where(
            Agent.url == url
        )
        results = await self.session.scalars(statement=statement)
        agent = results.one_or_none() # type: Agent | None
        
        return agent


    async def patch(self, agent: Agent, data: AgentPatchRequest) -> Agent:
        values = data.model_dump(exclude_unset=True)
        _agent_config = AgentConfig.model_validate(agent.agent_config)
        for k, v in values.items():
            if k == "category_ids":
                statement = select(
                    ActionCategory
                ).where(
                    ActionCategory.id.in_(data.category_ids)
                )
                results = await self.session.execute(statement=statement)
                categories = results.scalars().all()
                agent.categories = categories
            else:
                setattr(agent, k, v)

                # Update the agent_config
                if k == 'snake_case_name':
                    setattr(_agent_config, 'agent_name', v)
                elif k == 'description':
                    setattr(_agent_config, 'agent_description', v)
                elif k in {"agent_type", "llm_option", "llm_api_key"}:
                    setattr(_agent_config, k, v)

        agent.agent_config = _agent_config.model_dump()

        self.session.add(agent)
        await self.session.commit()
        await self.session.refresh(agent)

        return agent
    

    async def delete(self, agent: Agent) -> bool:
        await self.session.delete(agent)

        # TODO: Delete schedules and actions associated with this agent
        await self.session.commit()

        return True


    async def get_agents_by_account_uuid(self, account_uuid: UUID) -> List[Agent]:
        statement = select(
            Agent
        ).where(
            Agent.creator_id == account_uuid
        )

        agents = await self.session.scalars(statement=statement)

        return agents
    

    async def get_agents_by_category_id(self, category_id: int) -> List[Agent]:
        statement = select(
            ActionCategory
        ).where(
            ActionCategory.id == int(category_id)
        )

        result = await self.session.execute(statement=statement)
        action_category = result.scalar_one_or_none() # type: ActionCategory | None
        agents = action_category.agents

        return agents


async def get_agent_crud(
    session: AsyncSession = Depends(get_async_session)
) -> AgentCRUD:
    return AgentCRUD(session=session)
