from enum import Enum
from typing import List, Union, Set, Dict, Optional, Any
from pydantic import BaseModel, RootModel, root_validator
from monoid_backend.monoid.agent.utils import AgentType
from monoid_backend.monoid.llm_utils import LLMOption

class ActionType(str, Enum):
    api = "api"
    query = "query"
    expert_agent = "expert_agent"


class ArgumentProvider(str, Enum):
    creator = "creator"
    agent = "agent"
    user = "user"


class DataType(str, Enum):
    string = "string"
    number = "number"
    boolean = "boolean"



#===================#
# ACTION PARAMETERS #
#===================#

class APIActionParameter(BaseModel):
    key: str
    value: Optional[Union[str, int, bool]] = None
    description: str
    data_type: DataType
    is_required: bool
    argument_provider: ArgumentProvider
    enum: Optional[List[Union[str, int, bool]]] = None
    # is_sensitive: bool


class APIActionParameters(RootModel):
    root: Optional[Dict[str, Union[APIActionParameter, "APIActionParameters"]]] = None


#======================#
# FUNCTION CALL CONFIG #
#======================#
class Property(BaseModel):
    type: DataType
    description: str
    enum: Optional[List[Union[str, int, bool]]] = None

    @root_validator(skip_on_failure=True)
    def _remove_enum_if_none(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        if "enum" in values and values["enum"] is None:
            del values["enum"]
        return values


class Properties(RootModel):
    root: Dict[str, Property]


class Parameter(BaseModel):
    type: str = 'object'
    properties: Properties = {}
    required: Optional[List[str]] = []


class FunctionCallConfig(BaseModel):
    name: str
    description: str
    parameters: Parameter


#============================#
# FUNCTION CALL KEYS TO PATH
#============================#
class FunctionCallPathAndPlacement(BaseModel):
    path: str
    placement: str

class FunctionCallKeysToPaths(RootModel):
    root: Dict[str, FunctionCallPathAndPlacement]


#============================#
# USER CONFIGURABLES
#============================#
class UserConfigurableParameter(BaseModel):
    key: str
    description: str
    data_type: DataType
    is_required: bool
    enum: Optional[List[Union[str, int, bool]]] = None
    placement: str
    path: str

class UserConfigurables(RootModel):
    root: List[UserConfigurableParameter]


#=============#
# API CONFIGS #
#=============#
class FlatParameter(RootModel):
    root: Dict[str, Union[str, int, bool]]

class NestedParameter(RootModel):
    root: Dict[str, Union[str, int, bool, "NestedParameter"]]

class APIConfig(BaseModel):
    method: str
    template_url: str
    headers: FlatParameter
    path_parameters: FlatParameter
    query_parameters: FlatParameter
    body: NestedParameter


#===================#
# COUNSELER CONFIGS #
#===================#
class ExpertAgentConfig(BaseModel):
    expert_agent_id: int


#================#
# ACTION CONFIGS #
#================#
# TODO: ActionConfig can have APIConfig | ExpertAgentConfig | SQLConfig
class ActionConfig(BaseModel):
    action_type: ActionType
    api_config: Optional[APIConfig] = None
    expert_agent_config: Optional[ExpertAgentConfig] = None
    # sql_config: Optional[SQLConfig]
    followup_prompt: Optional[str] = None
    function_call_keys_to_paths: Optional[FunctionCallKeysToPaths] = None
    function_call_config: FunctionCallConfig

class _ActionConfigs(RootModel):
    root: Dict[str, ActionConfig] # key can be api_action_id, expert_agent_id (=agent_id)

class AllActionConfigs(RootModel):
    root: Dict[ActionType, _ActionConfigs] # key must be one of ActionType

#==============#
# AGENT CONFIG #
#==============#

class AgentConfig(BaseModel):
    agent_name: str
    agent_description: str
    agent_type: AgentType
    llm_option: Optional[LLMOption] = None
    llm_api_key: Optional[str] = None
    all_action_configs: Optional[AllActionConfigs] = None

class AgentConfigOrNone(RootModel):
    root: Optional[AgentConfig] = None