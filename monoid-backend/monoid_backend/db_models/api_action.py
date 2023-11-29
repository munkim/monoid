import enum
from sqlalchemy import Index, Column, Integer, Sequence, String, DateTime, ForeignKey, Boolean, Enum, Table
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func

from monoid_backend.db_models.base_class import Base
from monoid_backend.db_models.action import ActionCategory, api_action_category_association
from monoid_backend.monoid.action.action_config_model import (
    APIActionParameters,
    FunctionCallKeysToPaths,
    FunctionCallConfig,
    UserConfigurables,
    APIConfig
)

class APIMethod(str, enum.Enum):
    GET = 'GET'
    POST = 'POST'
    PUT = 'PUT'
    PATCH = "PATCH"
    DELETE = "DELETE"

    
class APIAction(Base):
    __tablename__ = 'api_action'
    id = Column(Integer, Sequence('api_action_id_seq'), primary_key=True, index=True)
    name = Column(String, index=True)
    snake_case_name = Column(String, nullable=True)
    description = Column(String, nullable=True)
    followup_prompt = Column(String, nullable=True)
    is_public = Column(Boolean, nullable=False, index=True)

    is_user_confirmation_needed = Column(Boolean, nullable=False, index=True)
    is_admin_approval_needed = Column(Boolean, nullable=False, index=True)

    method = Column(Enum(APIMethod), nullable=True)
    template_url = Column(String, nullable=True)
    headers = Column(JSON, nullable=True) # See below for schema
    path_parameters = Column(JSON, nullable=True) # See below for schema
    query_parameters = Column(JSON, nullable=True) # See below for schema
    body = Column(JSON, nullable=True) # See below for schema

    api_config = Column(JSON, nullable=True) # See below for schema
    user_configurables = Column(JSON, nullable=True) # See below for schema
    function_call_keys_to_paths = Column(JSON, nullable=True) # See below for schema
    function_call_config = Column(JSON, nullable=True) # See below for schema

    creator_id = Column(UUID(as_uuid=True), ForeignKey('account.uuid'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("Account")
    categories = relationship("ActionCategory", back_populates="api_actions", secondary=api_action_category_association, lazy='selectin') # type: list[ActionCategory]
    configured_actions = relationship("ConfiguredAction", back_populates="api_action")

    @validates('headers')
    def validate_headers(self, key, headers):
        APIActionParameters.model_validate(headers)
        return headers
    
    @validates('query_parameters')
    def validate_query_parameters(self, key, query_parameters):
        APIActionParameters.model_validate(query_parameters)
        return query_parameters
    
    @validates('path_parameters')
    def validate_path_parameters(self, key, path_parameters):
        APIActionParameters.model_validate(path_parameters)
        return path_parameters

    @validates('body')
    def validate_body(self, key, body):
        APIActionParameters.model_validate(body)
        return body
    
    @validates('api_config')
    def validate_api_config(self, key, api_config):
        APIConfig.model_validate(api_config)
        return api_config
    
    @validates('user_configurables')
    def validate_user_configurables(self, key, user_configurables):
        UserConfigurables.model_validate(user_configurables)
        return user_configurables
    
    @validates('function_call_keys_to_paths')
    def validate_function_call_keys_to_paths(self, key, function_call_keys_to_paths):
        FunctionCallKeysToPaths.model_validate(function_call_keys_to_paths)
        return function_call_keys_to_paths
    
    @validates('function_call_config')
    def validate_function_call_config(self, key, function_call_config):
        FunctionCallConfig.model_validate(function_call_config)
        return function_call_config