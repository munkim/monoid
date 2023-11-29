from sqlalchemy import Column, Integer, Sequence, String, DateTime, ForeignKey, Boolean, Enum, Table
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship, validates, Mapped
from sqlalchemy.sql import func
from jsonschema import validate

from monoid_backend.db_models.base_class import Base
from monoid_backend.db_models.account import Account
from monoid_backend.monoid.llm_utils import LLMOption
from monoid_backend.monoid.action.action_config_model import ActionConfig, ActionType, AgentConfig
from monoid_backend.monoid.agent.utils import AgentType
from monoid_backend.db_models.action import ActionCategory, agent_category_association


# TODO 1: Change the name to ConfiguredAction
class ConfiguredAction(Base):
    __tablename__ = 'configured_action'
    id = Column(Integer, autoincrement=True, primary_key=True, index=True, unique=True)
    agent_id = Column(Integer, ForeignKey('agent.id', ondelete='CASCADE'), index=True)
    action_type = Column(Enum(ActionType), nullable=False)
    # TODO: Rename configured_action.action_id to api_action_id
    action_id = Column(Integer, ForeignKey('api_action.id'), index=True, nullable=True) # TODO: give a warning sign when an action is deleted
    expert_agent_id = Column(Integer, ForeignKey('agent.id'), index=True, nullable=True) # TODO: give a warning sign when an agent is deleted
    creator_id = Column(UUID, ForeignKey('account.uuid', ondelete='CASCADE'))
    user_configured_arguments = Column(JSON, nullable=True)
    action_config = Column(JSON, nullable=True) # type: ActionConfig | None
    name = Column(String, nullable=False)
    snake_case_name = Column(String, nullable=True)
    description = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    agent = relationship("Agent", back_populates="configured_actions", foreign_keys=[agent_id])
    api_action = relationship("APIAction", back_populates="configured_actions")
    expert_agent = relationship("Agent", foreign_keys=[expert_agent_id])
    creator = relationship("Account")


# Currently Not Used
class AgentSchedule(Base):
    __tablename__ = 'agent_schedule'
    id = Column(Integer, autoincrement=True, primary_key=True, index=True, unique=True)
    agent_id = Column(Integer, ForeignKey('agent.id'))
    # encoded_agent_config = Column(String, nullable=False)
    creator_id = Column(UUID, ForeignKey('account.uuid'))
    target_email = Column(String, unique=True, nullable=True) # Sendgrid
    target_number = Column(String, unique=True, nullable=True) # Twilio

    group_name = Column(String, nullable=False)
    name = Column(String, nullable=False)

    aws_schedule_arn = Column(String, nullable=False)
    input_prompt = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    schedule_expression = Column(String, nullable=False)
    schedule_expression_timezone = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    creator: Mapped[Account] = relationship("Account")
    agent = relationship("Agent", back_populates="agent_schedules")

# Association table for many-to-many relationship between API Action and Category
agent_network_association = Table(
    'agent_network_association', Base.metadata,
    Column('client_agent_id', Integer, ForeignKey('agent.id')),
    Column('expert_agent_id', Integer, ForeignKey('agent.id'))
)


class Agent(Base):
    __tablename__ = 'agent'
    id = Column(Integer, autoincrement=True, primary_key=True, index=True, unique=True)
    name = Column(String, index=True)
    snake_case_name = Column(String, nullable=True)
    description = Column(String, nullable=False)
    instructions = Column(String, nullable=True)
    slug = Column(String, nullable=False)
    url = Column(String, primary_key=True, index=True, unique=True, nullable=False)
    agent_type =  Column(Enum(AgentType), nullable=False)
    creator_id = Column(UUID, ForeignKey('account.uuid'))
    is_public = Column(Boolean, nullable=False)
    agent_config = Column(JSON, nullable=True)
    llm_option = Column(Enum(LLMOption), nullable=False, default=LLMOption.OPENAI_GPT3_5_TURBO_0613)
    llm_api_key = Column(String, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("Account")
    configured_actions = relationship("ConfiguredAction", back_populates="agent", foreign_keys=[ConfiguredAction.agent_id], cascade="all,delete") # type: list[ConfiguredAction]
    # expert_agents_as_action = relationship("ConfiguredAction", back_populates="expert_agent", foreign_keys=[ConfiguredAction.expert_agent_id], cascade="all,delete") # type: list[ConfiguredAction]
    categories = relationship("ActionCategory", back_populates="agents", secondary=agent_category_association, lazy='selectin') # type: list[ActionCategory]
    expert_agents = relationship(
        "Agent", 
        secondary=agent_network_association,
        primaryjoin=id==agent_network_association.c.client_agent_id,
        secondaryjoin=id==agent_network_association.c.expert_agent_id,
        back_populates="client_agents"
    )
    client_agents = relationship(
        "Agent", 
        secondary=agent_network_association,
        primaryjoin=id==agent_network_association.c.expert_agent_id,
        secondaryjoin=id==agent_network_association.c.client_agent_id,
        back_populates="expert_agents"
    )
    
    agent_schedules = relationship("AgentSchedule", back_populates="agent")

    @validates('agent_config')
    def validate_agent_config(self, key, agent_config): 
        AgentConfig.model_validate(agent_config)
        return agent_config