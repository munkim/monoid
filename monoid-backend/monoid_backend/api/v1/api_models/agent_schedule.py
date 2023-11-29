from typing import Optional
from datetime import date
from pydantic import BaseModel
from datetime import datetime

class AgentScheduleBase(BaseModel):
    input_prompt: str
    schedule_expression: str
    schedule_expression_timezone: str


class AgentScheduleCreatePatchRequest(AgentScheduleBase):
    start_date: Optional[datetime] = None # Must be in isoformat
    end_date: Optional[datetime] = None # Must be in isoformat
    target_email: Optional[str] = None
    target_number: Optional[str] = None


class AgentScheduleCreatePatchResponse(AgentScheduleCreatePatchRequest):
    schedule_name: str = None
    agent_id: int = None
    created_at: datetime = None
    updated_at: datetime = None