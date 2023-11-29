import re
import uuid
from enum import Enum
from typing import List, Any, Optional, Union
from pydantic import BaseModel, ValidationError, model_validator
from monoid_backend.db_models.action import ActionMethodType


class ActionCategory(BaseModel):
    category_id: int
    name: str
    description: Optional[str]

class ActionCategoryCreateOrPatchRequest(BaseModel):
    name: str
    description: str

class ActionCategoryReadResponse(BaseModel):
    action_id: int
    name: str
    description: Optional[str]

class ActionCategoryListReadResponse(BaseModel):
    action_category_list: List[ActionCategoryReadResponse]