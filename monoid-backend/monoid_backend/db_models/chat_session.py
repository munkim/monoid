"""
The following models are ONLY used for type hinting the models created on ScyllaDB (Cassandra).
CQLEngine offers Cassandra ORM, but it does not offer support for Materialized View or async executions.
MV was on their roadmap since 2016, but it's still not implemented.

For the exact model definitions, refer to `scripts/create_chat_session_models.py`
"""

import uuid
from datetime import datetime
from pydantic import BaseModel

class ChatSession(BaseModel):
    chat_session_uuid: uuid.UUID
    account_uuid: uuid.UUID
    agent_id: int
    title: str
    created_at: datetime
    updated_at: datetime

class ChatMessage(BaseModel):
    chat_session_uuid: uuid.UUID
    message_uuid: uuid.UUID
    account_uuid: uuid.UUID
    agent_id: int
    message_type: str
    content: str
    content_length: int
    action_name: str
    action_type: str
    message_author_type: str
    message_author_name: str
    nesting_level: int
    created_at: datetime