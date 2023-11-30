from uuid import UUID, uuid4
from typing import List, Dict
from fastapi import Depends
from datetime import datetime
from cassandra.cluster import Session as AsyncSession, ResultSet
from monoid_backend.api.v1.api_models.chat_session import ChatSessionCreateRequest, ChatSessionHeader, ChatSessionMessageRequest
from monoid_backend.core.cassandra import get_cassandra_session
from monoid_backend.db_models.chat_session import ChatSession, ChatMessage


class ChatSessionCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, account_uuid: UUID, data: ChatSessionCreateRequest, is_scheduled: bool = False):
        chat_session_uuid = uuid4()
        updated_at = created_at = datetime.now()
        agent_id = data.agent_id
        title = data.title

        result = self.session.execute_async(
            """
            INSERT INTO monoid.chat_session (
                chat_session_uuid,
                account_uuid,
                agent_id,
                title,
                created_at,
                updated_at,
                is_scheduled
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (chat_session_uuid, account_uuid, agent_id, title, created_at, updated_at, is_scheduled)
        ).result()

        return chat_session_uuid, created_at, updated_at
    

    async def write_message(self, 
        message_type: str, 
        chat_session_uuid: UUID,
        account_uuid: UUID, 
        agent_id: int,
        content: str, 
        content_length: int,
        message_author_name: str,
        message_author_type: str,
        action_name: str = None,
        action_type: str = None,
        nesting_level: int = None,
        update_session: bool = True,
    ):
        created_at = datetime.now()
        message_uuid = uuid4()

        result = self.session.execute_async(
            """
            INSERT INTO monoid.chat_message (
                chat_session_uuid,
                message_uuid,
                account_uuid,
                agent_id,
                message_type,
                content,
                content_length,
                action_name,
                action_type,
                message_author_type,
                message_author_name,
                nesting_level,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                chat_session_uuid, 
                message_uuid, 
                account_uuid, 
                agent_id, 
                message_type, 
                content, 
                content_length, 
                action_name, 
                action_type, 
                message_author_type, 
                message_author_name, 
                nesting_level,
                created_at
            )
        ).result()

        # Only update if not scheduled because scheduled messages will only have one message
        if update_session:
            result = self.session.execute_async(
                """
                UPDATE monoid.chat_session
                    SET 
                        updated_at = %s
                    WHERE
                        chat_session_uuid = %s
                        and account_uuid = %s
                        and agent_id = %s;
                """,
                (created_at, chat_session_uuid, account_uuid, agent_id)
            ).result()

        return message_uuid, created_at


    async def get(self, account_uuid: UUID, agent_id: int, chat_session_uuid: UUID) -> ChatSession:
        result = self.session.execute_async(
            """
            SELECT 
                chat_session_uuid,
                account_uuid,
                agent_id,
                title,
                created_at,
                updated_at
            FROM monoid.chat_session 
            WHERE 
                account_uuid = %s 
                and agent_id = %s 
                and chat_session_uuid = %s
            """,
            (account_uuid, agent_id, chat_session_uuid)
        ).result()

        return result.one()
    
    
    async def get_all_sessions(self, account_uuid: UUID, agent_id: int) -> List[ChatSession]:
        result = self.session.execute_async(
            """
            SELECT 
                chat_session_uuid,
                account_uuid,
                agent_id,
                title,
                created_at,
                updated_at,
                is_scheduled
            FROM monoid.chat_session
            WHERE account_uuid = %s and agent_id = %s
            """,
            (account_uuid, agent_id)
        ).result()
        return result
    

    async def get_messages_by_chat_session_uuid(self, chat_session_uuid: UUID) -> List[ChatMessage]:
        result = self.session.execute_async(
            """
            SELECT 
                chat_session_uuid,
                message_uuid,
                account_uuid,
                agent_id,
                message_type,
                content,
                content_length,
                action_name,
                action_type,
                message_author_type,
                message_author_name,
                nesting_level,
                created_at
            FROM monoid.chat_message 
            WHERE chat_session_uuid = %s
            """,
            (chat_session_uuid,)
        ).result()

        return result


    async def update_title(self, chat_session_uuid: UUID, title: str, account_uuid: UUID, agent_id: int) -> ChatSessionHeader:
        updated_at = datetime.now()
        result = self.session.execute_async(
            """
            UPDATE monoid.chat_session
                SET 
                    title = %s, 
                    updated_at = %s
                WHERE 
                    chat_session_uuid = %s
                    and account_uuid = %s
                    and agent_id = %s;
            """,
            (title, updated_at, chat_session_uuid, account_uuid, agent_id)
        ).result()

        return title, updated_at

    async def delete_session(self, account_uuid: UUID, agent_id: int, chat_session_uuid: UUID) -> bool:
        result = self.session.execute_async(
            """
            DELETE FROM monoid.chat_session 
            WHERE 
                account_uuid = %s 
                and agent_id = %s 
                and chat_session_uuid = %s
            """,
            (account_uuid, agent_id, chat_session_uuid)
        ).result()

        return True
    
    
async def get_chat_session_crud(
    session: AsyncSession = Depends(get_cassandra_session)
):
    return ChatSessionCRUD(session=session)
