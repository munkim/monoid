from typing import Any, List, Optional, Union
from pydantic import BaseModel, Json
from datetime import date, datetime, time, timedelta
from monoid_backend.monoid.agent.utils import AgentType
from monoid_backend.api.v1.api_models.action import ActionCategory
# from monoid_backend.api.v1.api_models.action import DataType
from monoid_backend.monoid.llm_utils import LLMOption


class AgentBase(BaseModel):
    name: str
    snake_case_name: Optional[str] = None
    description: str
    instructions: Optional[str] = None
    subdomain: str
    slug: str
    agent_type: AgentType
    is_public: bool
    llm_option: Optional[LLMOption] = LLMOption.OPENAI_GPT3_5_TURBO_0613
    llm_api_key: Optional[str] = None


class AgentReadResponse(AgentBase):
    agent_id: Optional[int] = None
    agent_config: Optional[Json] = None
    is_editable: bool
    categories: Optional[List[ActionCategory]] = None


class AgentReadEncodedResponse(AgentReadResponse):
    encoded_agent_config: str


class AgentListReadResponse(BaseModel):
    agent_base_list: List[AgentReadResponse]


class AgentCreateRequest(AgentBase):
    category_ids: Optional[List[int]] = None


class AgentPatchRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    agent_type: Optional[AgentType] = None
    is_public: Optional[bool] = None
    category_ids: Optional[List[int]] = None
    llm_option: Optional[LLMOption] = None
    llm_api_key: Optional[str] = None

class URLAvailabilityResponse(BaseModel):
    is_available: bool
    message: str