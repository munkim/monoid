from fastapi import Depends
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from monoid_backend.api.v1.api_models.auth import AuthCreate
from monoid_backend.core.database import get_async_session

from monoid_backend.db_models.account import Account
from monoid_backend.db_models.auth import Auth

class AuthCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: AuthCreate) -> Auth:
        auth = Auth(
            access_token = data.access_token,
            refresh_token = data.refresh_token,
            session_token = data.session_token,
            account_id = data.account_id,
            created_at = datetime.now(),
            updated_at = datetime.now(),
            expires_at = datetime.now() + timedelta(days=30)
        )
        self.session.add(auth)
        await self.session.commit()
        await self.session.refresh(auth)

        return auth
    
    async def get_account_by_token(self, session_token: str) -> Account:
        statement = select(
            Account
        ).join(
            Auth
        ).where(
            Auth.session_token == session_token,
            Auth.expires_at > datetime.now()
        )
        results = await self.session.execute(statement=statement)

        # TODO: on valid token, extend token expiration
        
        return results.scalar_one_or_none()
    
async def get_auth_crud(
    session: AsyncSession = Depends(get_async_session)
) -> AuthCRUD:
    return AuthCRUD(session=session)
