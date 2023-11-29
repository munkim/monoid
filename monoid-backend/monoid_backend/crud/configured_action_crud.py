import os
from uuid import UUID
from datetime import datetime
from typing import Any, List, Dict, Tuple, Optional
from jsonschema import validate

from sqlalchemy.orm.attributes import flag_modified
from fastapi import Depends, HTTPException
from fastapi import status as http_status
from sqlalchemy import delete, select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import lazyload, selectinload

from monoid_backend.api import helpers
from monoid_backend.db_models.account import Account
from monoid_backend.db_models.api_action import APIAction
from monoid_backend.db_models.agent import Agent, ConfiguredAction, AgentSchedule
from monoid_backend.api.v1.api_models.configured_action import ConfiguredActionBase, ConfiguredActionPatchRequest, ConfiguredActionCreateRequest
from monoid_backend.core.database import get_async_session
from monoid_backend.monoid.action.action_config_model import ActionConfig, ActionType, AgentConfig


class ConfiguredActionCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self, 
        agent_id: int, 
        action_config: ActionConfig, 
        action_type: ActionType,
        data: ConfiguredActionCreateRequest,
        agent: Agent, 
        api_action: Optional[APIAction], 
        expert_agent: Optional[Agent], 
        creator: Account
    ) -> ConfiguredAction:
        # Serialize the data so we can extract a json object (i.e. user_configured_arguments)
        values = data.model_dump(exclude_unset=True)
        action_config_json = action_config.model_dump(mode='json')

        assert (not data.action_id) or (not data.expert_agent_id), "Either action_id or expert_agent_id must be present"

        configured_action = ConfiguredAction(
            agent_id = agent_id,
            action_type = action_type,
            action_id = data.action_id, 
            expert_agent_id = data.expert_agent_id,
            user_configured_arguments = values.get("user_configured_arguments"),
            creator_id = creator.uuid,
            name = data.name,
            snake_case_name = data.snake_case_name,
            description = data.description,
            action_config = action_config_json
        )

        if action_type == ActionType.api:
            configured_action.api_action = api_action
            entity_id = configured_action.action_id
        elif action_type == ActionType.expert_agent:
            configured_action.expert_agent = expert_agent
            agent.expert_agents += [expert_agent]
            entity_id = configured_action.expert_agent_id
        # TODO: Implement SQL Action Type
        else:
            # Raise Not Implemented Error
            raise NotImplementedError(f"Action type {action_type.value} not implemented")


        configured_action.agent = agent
        configured_action.creator = creator

        self.session.add(configured_action)

        # Update part of agent_config
        # TODO: Polish this up along with agent_crud functions
        # TODO: Add AgentConfig model validation / dump
        agent_config = agent.agent_config
        if agent_config:
            agent_config["agent_name"] = agent.name
            agent_config["agent_description"] = agent.description
            agent_config["agent_type"] = agent.agent_type
            agent_config["llm_option"] = agent.llm_option
            agent_config["llm_api_key"] = agent.llm_api_key
            if not agent_config.get("all_action_configs"):
                agent_config["all_action_configs"] = {}
            if action_type.value not in agent_config["all_action_configs"]:
                agent_config["all_action_configs"][action_type.value] = {}
            agent_config["all_action_configs"][action_type.value][str(entity_id)] = action_config_json

        else:
            agent_config = {
                "agent_name": agent.name,
                "agent_description": agent.description,
                "agent_type": agent.agent_type,
                "llm_option": agent.llm_option,
                "llm_api_key": agent.llm_api_key,
                "all_action_configs": {
                    action_type.value: {
                        str(entity_id): action_config_json
                    }
                }
            }

        # Replace with new agent_config
        agent.agent_config = agent_config
        flag_modified(agent, "agent_config")
        self.session.add(agent)

        # Commit all changes  
        await self.session.commit()
        await self.session.refresh(agent)
        await self.session.refresh(configured_action)

        return configured_action
    

    async def get(self, configured_action_id: int) -> ConfiguredAction:
        statement = select(
            ConfiguredAction
        ).where(
            ConfiguredAction.id == configured_action_id
        ).options(
            selectinload(ConfiguredAction.api_action)
        )

        results = await self.session.scalars(statement=statement)
        configured_action = results.unique().one_or_none() # type: ConfiguredAction | None
        
        return configured_action
    

    async def get_configured_actions_by_agent_id(self, agent_id: int) -> List[ConfiguredAction]:
        statement = select(
            ConfiguredAction
        ).where(
            ConfiguredAction.agent_id == agent_id
        )
        configured_actions = await self.session.scalars(statement=statement) # type: List[ConfiguredAction] | None

        return configured_actions
   

    async def get_configured_action_by_action_id(self, agent_id: int, action_id: int) -> ConfiguredAction:
        statement = select(
            ConfiguredAction
        ).where(
            and_(
                ConfiguredAction.agent_id == agent_id,
                ConfiguredAction.action_id == action_id
            )
        )
        configured_action = await self.session.scalars(statement=statement) # type: ConfiguredAction | None
        configured_action = configured_action.unique().one_or_none()

        return configured_action


    async def get_configured_action_by_expert_agent_id(self, agent_id: int, expert_agent_id: int) -> ConfiguredAction:
        statement = select(
            ConfiguredAction
        ).where(
            and_(
                ConfiguredAction.agent_id == agent_id,
                ConfiguredAction.expert_agent_id == expert_agent_id
            )
        )
        configured_action = await self.session.scalars(statement=statement) # type: ConfiguredAction | None
        configured_action = configured_action.unique().one_or_none()

        return configured_action


    async def patch(
        self,
        agent: Agent,
        new_action_config: ActionConfig,
        configured_action: ConfiguredAction,
        data: ConfiguredActionPatchRequest
    ) -> ConfiguredAction:
        # Update configured_action
        values = data.model_dump(exclude_unset=True)
        for k, v in values.items():
            setattr(configured_action, k, v)

        # Replace with new action_config
        new_action_config_json = new_action_config.model_dump(mode='json')

        configured_action.action_config = new_action_config_json
        self.session.add(configured_action)

        if configured_action.action_type == ActionType.api:
            entity_id = configured_action.action_id
        elif configured_action.action_type == ActionType.expert_agent:
            entity_id = configured_action.expert_agent_id
        # TODO: Implement SQL Action Type
        else:
            raise NotImplementedError(f"Action type {configured_action.action_type} not implemented")

        # Update agent_config
        agent_config = agent.agent_config
        if agent_config:
            try:
                assert configured_action.action_type.value in agent_config["all_action_configs"]
            except AssertionError:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Action type not found in agent_config"
                )

            agent_config["all_action_configs"][configured_action.action_type.value][str(entity_id)] = new_action_config_json
        else:
            agent_config = {
                "agent_type": agent.agent_type,
                "all_action_configs": {
                    configured_action.action_type.value: {
                        str(entity_id): new_action_config_json
                    }
                }
            }

        # Replace with new agent_config
        agent.agent_config = agent_config
        flag_modified(agent, "agent_config")
        self.session.add(agent)

        await self.session.commit()
        await self.session.refresh(agent)
        await self.session.refresh(configured_action)

        return configured_action # type: ConfiguredAction


    async def delete(self, agent: Agent, configured_action: ConfiguredAction) -> bool:
        # Delete configured_action
        await self.session.delete(configured_action)
        
        if configured_action.action_type == ActionType.api:
            entity_id = configured_action.action_id
        elif configured_action.action_type == ActionType.expert_agent:
            entity_id = configured_action.expert_agent_id
        # TODO: Implement SQL Action Type
        else:
            raise NotImplementedError(f"Action type {configured_action.action_type.value} not implemented")

        # Delete action_config from agent_config
        agent_config = agent.agent_config
        if agent_config:
            agent_config["all_action_configs"][configured_action.action_type.value].pop(str(entity_id), None)
            agent.agent_config = agent_config
            # if configured_action.action_type in agent_config["all_action_configs"]:
            #     agent_config["all_action_configs"][configured_action.action_type].pop(str(entity_id), None)
            # else: 
            #     agent_config["all_action_configs"] = {
            #         configured_action.action_type: {}
            #     }
            #     agent.agent_config = agent_config
            flag_modified(agent, "agent_config")
            self.session.add(agent)

        await self.session.commit()

        return True
    
    async def delete_for_agent(self, agent: Agent) -> bool:
        # Delete all configured_actions that belong to an agent
        statement = delete(
            ConfiguredAction
        ).where(
            ConfiguredAction.agent_id == agent.id
        )
        await self.session.execute(statement)

        # # Delete all action_configs from agent_config
        # # TODO: In order to do this, we need to send the 
        # #       agent action to a transient state (whatever it means)
        # agent_config = agent.agent_config
        # if agent_config:
        #     agent_config["all_action_configs"] = {}
        #     agent.agent_config = agent_config

        #     flag_modified(agent, "agent_config")
        #     self.session.add(agent) 

        await self.session.commit()
        await self.session.refresh(agent)

        return True
    
    

async def get_configured_action_crud(
    session: AsyncSession = Depends(get_async_session)
) -> ConfiguredActionCRUD:
    return ConfiguredActionCRUD(session=session)
