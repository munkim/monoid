import uuid
import enum
import jsonschema
from sqlalchemy import Index, Column, Integer, Sequence, String, DateTime, ForeignKey, Boolean, Enum, Table
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func

from monoid_backend.db_models.base_class import Base

class ActionMethodType(str, enum.Enum):
    GET = 'GET'
    POST = 'POST'
    PUT = 'PUT'


# Association table for many-to-many relationship between API Action and Category
api_action_category_association = Table(
    'api_action_category_association', Base.metadata,
    Column('api_action_id', Integer, ForeignKey('api_action.id')),
    Column('category_id', Integer, ForeignKey('action_category.id'))
)

# Association table for many-to-many relationship between API Action and Category
agent_category_association = Table(
    'agent_as_action_category_association', Base.metadata,
    Column('agent_id', Integer, ForeignKey('agent.id')),
    Column('category_id', Integer, ForeignKey('action_category.id'))
)


class ActionCategory(Base):
    __tablename__ = 'action_category'
    id = Column(Integer, Sequence('action_category_id_seq'), primary_key=True, index=True, unique=True)
    name = Column(String, index=True)
    description = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    api_actions = relationship("APIAction", back_populates="categories", secondary=api_action_category_association, lazy='selectin')
    agents = relationship("Agent", back_populates="categories", secondary=agent_category_association, lazy='selectin')
