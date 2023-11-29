import random
from uuid import UUID
from datetime import datetime
import string

from fastapi import Depends, HTTPException
from fastapi import status as http_status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from monoid_backend.db_models.account import Account, SignUp
from monoid_backend.api.v1.api_models.account import AccountCreate, AccountPatch, SignupForm
from monoid_backend.core.database import get_async_session

alphabet = string.ascii_lowercase + string.digits

class AccountCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: AccountCreate) -> Account:
        values = data.dict()

        if data.first_name is not None:
            subdomain = str(data.first_name).lower() + '-' + ''.join(random.choices(alphabet, k=5))
        else:
            subdomain = data.email.split('@')[0] + '-' + ''.join(random.choices(alphabet, k=5))

        account = Account(
            first_name = values['first_name'],
            last_name = values['last_name'],
            email = values['email'],
            subdomain = subdomain,
            created_at = datetime.now(),
            updated_at = datetime.now()
        )
        self.session.add(account)
        await self.session.commit()
        await self.session.refresh(account)

        return account
    
    async def signup(self, data: SignupForm):
        values = data.model_dump()

        signup = SignUp(
            company_name = values['company_name'],
            email = values['email']
        )

        self.session.add(signup)
        await self.session.commit()
        await self.session.refresh(signup)

        return signup

    async def get(self, account_id: UUID) -> Account:
        statement = select(
            Account
        ).where(
            Account.uuid == account_id
        )
        results = await self.session.execute(statement=statement)
        account = results.scalar_one_or_none()  # type: Account | None

        if account is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="The account hasn't been found!"
            )

        return account
    
    async def get_by_email(self, email: str) -> Account:
        statement = select(
            Account
        ).where(
            Account.email == email
        )
        results = await self.session.scalars(statement=statement)
        
        return results.one_or_none()

    async def patch(self, account_id: UUID, data: AccountPatch) -> Account:
        account = await self.get(account_id=account_id)
        values = data.model_dump(exclude_unset=True)

        for k, v in values.items():
            setattr(account, k, v)

        self.session.add(account)
        await self.session.commit()
        await self.session.refresh(account)

        return account

    async def delete(self, account_id: UUID) -> bool:
        statement = delete(
            Account
        ).where(
            Account.uuid == account_id
        )

        await self.session.execute(statement=statement)
        await self.session.commit()

        return True


async def get_account_crud(
    session: AsyncSession = Depends(get_async_session)
) -> AccountCRUD:
    return AccountCRUD(session=session)
