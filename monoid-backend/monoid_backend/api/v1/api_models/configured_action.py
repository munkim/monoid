from typing import List, Optional, Union
from pydantic import BaseModel

# TODO: In order to standardize this model for both api_action and expert_agent_action,
# we need to modify since placement and path is not needed for expert_agent_action.
class UserConfiguredArgument(BaseModel):
    key: str
    value: Union[str, int, bool]
    placement: str
    path: str

class ConfiguredActionBase(BaseModel):
    name: Optional[str]
    snake_case_name: Optional[str]
    description: Optional[str]
    user_configured_arguments: Optional[List[UserConfiguredArgument]]

class ConfiguredActionCreateRequest(ConfiguredActionBase):
    action_id: Optional[int] = None
    expert_agent_id: Optional[int] = None


class ConfiguredActionResponse(ConfiguredActionBase):
    configured_action_id: int
    agent_id: int
    action_id: Optional[int] = None
    expert_agent_id: Optional[int] = None


class ConfiguredActionPatchRequest(ConfiguredActionBase):
    pass
