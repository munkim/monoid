from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from pydantic import BaseModel


class ChatSessionCreateRequest(BaseModel):
    agent_id: int
    title: str

class ChatSessionHeader(BaseModel):
    chat_session_uuid: uuid.UUID
    title: str = ""
    updated_at: datetime

class ChatSessionHeaderPatch(BaseModel):
    chat_session_uuid: uuid.UUID
    title: str

class ChatSessionMessageResponse(BaseModel):
    chat_session_uuid: uuid.UUID
    created_at: datetime
    message_type: str
    content: str
    action_name: Optional[str] = None
    action_type: Optional[str] = None
    message_author_type: str
    message_author_name: str
    nesting_level: Optional[int] = None

class ChatSessionMessagesReadResponse(BaseModel):
    session_messages: List[ChatSessionMessageResponse]

class ChatSessionMessageRequest(BaseModel):
    chat_session_uuid: uuid.UUID
    content: str
    agent_id: int
    encoded_agent_config: Optional[str] = None # Encoded string for agent config

class ScheduledMessageRequest(BaseModel):
    content: str
    agent_id: int

class ChatSessionListReadResponse(BaseModel):
    chat_sessions: Optional[List[ChatSessionHeader]] = []