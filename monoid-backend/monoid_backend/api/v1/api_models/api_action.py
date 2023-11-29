import re
import uuid
from enum import Enum
from typing import Dict, List, Any, Optional, Union
from pydantic import BaseModel, ValidationError, model_validator
from monoid_backend.db_models.action import ActionMethodType

from monoid_backend.api.v1.api_models.action import ActionCategory
from monoid_backend.monoid.action.action_config_model import DataType, APIActionParameters, UserConfigurables


class APITestingResponse(BaseModel):
    status_code: int
    response: Any
    time_taken: float
    response_size: int


class ActionTestingResponse(BaseModel):
    api_status: int
    response: Any
    time_taken: float


class APIInfo(BaseModel):
    method: Optional[str] = "GET"
    template_url: Optional[str] = None
    headers: Optional[APIActionParameters] = None
    query_parameters: Optional[APIActionParameters] = None
    path_parameters: Optional[APIActionParameters] = None
    body: Optional[APIActionParameters] = None


class ActionInfo(BaseModel):
    action_id: Optional[int] = None
    name: Optional[str] = None
    snake_case_name: Optional[str] = None
    description: Optional[str] = None
    followup_prompt: Optional[str] = None
    is_public: Optional[bool] = False
    is_user_confirmation_needed: Optional[bool] = False
    is_admin_approval_needed: Optional[bool] = False


class APIActionConfig(BaseModel):
    action_info: ActionInfo
    api_info: APIInfo


class ActionCreateRequest(APIActionConfig):
    category_ids: List[int]


class ActionPatchRequest(APIActionConfig):
    category_ids: Optional[List[int]] = None


class ActionBasicListReadResponse(BaseModel):
    action_info_list: List[ActionInfo]


class UserConfigurableResponse(BaseModel):
    action_id: int
    creator_id: uuid.UUID
    name: str
    snake_case_name: str
    description: str
    is_public: bool

    user_configurable_parameters: UserConfigurables
    is_user_confirmation_needed: bool
    is_admin_approval_needed: bool


class ActionDetailedReadResponse(APIActionConfig):
    action_id: int
    creator_id: uuid.UUID
    categories: List[ActionCategory]
    is_editable: Optional[bool] = False

class APITest(BaseModel):
    action_id: int

class ActionTest(BaseModel):
    action_id: int
    user_message: str