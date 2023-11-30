from fastapi import APIRouter, Depends, HTTPException, Request, Body, Query
from fastapi import status as http_status
from typing import Any, List, Tuple
from monoid_backend.api import helpers
import uuid

from monoid_backend.api.v1.api_models.status_message import StatusMessage
from monoid_backend.api.v1.api_models.account import AccountCreate, AccountPatch, AccountRead, SignupForm
from monoid_backend.api.v1.api_models.auth import AuthCreate
from monoid_backend.crud.account_crud import AccountCRUD, get_account_crud
from monoid_backend.db_models.account import Account
from monoid_backend.crud.auth_crud import AuthCRUD, get_auth_crud
from cassandra.cluster import Session as CassandraSession
from monoid_backend.core.cassandra import get_cassandra_session
from datetime import datetime

router = APIRouter()


@router.post(
    "",
    response_model=AccountRead,
    status_code=http_status.HTTP_201_CREATED,
    description="Create and return an account"
)
async def create_account(
    data: AccountCreate,
    accountCRUD: AccountCRUD = Depends(get_account_crud),
    authCRUD: AuthCRUD = Depends(get_auth_crud)
) -> AccountRead:
    account = await accountCRUD.create(data=data)

    session_token = uuid.uuid4()
    access_token = uuid.uuid4().hex
    refresh_token = uuid.uuid4().hex

    await authCRUD.create(
        data=AuthCreate(
            session_token=session_token,
            access_token=access_token,
            refresh_token=refresh_token,
            account_id=account.id,
            subdomain=account.subdomain,
        )
    )
    
    account_response = AccountRead(
        first_name=account.first_name,
        last_name=account.last_name,
        email=account.email,
        subdomain=account.subdomain,
        session_token=session_token,
    )
    return account_response



# TODO: Clean this up and move the CRUD logic to a dedicated CRUD file
@router.post(
    "/email-whitelist",
    response_model=StatusMessage,
    status_code=http_status.HTTP_200_OK,
    description="Add an email to a whitelist"
)
async def add_to_whitelist(
    email: str = Body(..., embed=True),
    cassandra_session: CassandraSession = Depends(get_cassandra_session),
    current_account: Account = Depends(helpers.get_current_account),
):
    # Check if the current account is an admin (Mun, Gloria, or Edwin)
    if current_account.email not in set(["mun@monoid.so", "gloria@monoid.so", "edwin@monoid.so"]):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail=f"Only admins can add to the whitelist"
        )

    # Check if the email is already in the whitelist
    query = """
        SELECT * FROM monoid.whitelisted_emails WHERE email = %s
    """
    res = cassandra_session.execute_async(query, (email,))
    if res.result():
        return StatusMessage(status=False, message=f"{email} is already in the whitelist")

    # Add the email to the whitelist
    insert_query = """
        INSERT INTO monoid.whitelisted_emails (
            email,
            created_at
        )
        VALUES (%s, %s)
    """
    res = cassandra_session.execute_async(insert_query, (email, datetime.now()))

    return StatusMessage(status=True, message=f"{email} has been added to the whitelist")



@router.post(
    "/signup",
    response_model=str,
    status_code=http_status.HTTP_201_CREATED,
    description="Landing Page Signup"
)
async def landing_page_signup(
    data: SignupForm,
    accountCRUD: AccountCRUD = Depends(get_account_crud),
) -> str:
    await accountCRUD.signup(data)
    
    return "success"


@router.get(
    "",
    response_model=AccountRead,
    status_code=http_status.HTTP_200_OK,
    description="Get an account by account_id"
)
async def get_account_by_id(
    current_account: Account = Depends(helpers.get_current_account)
) -> AccountRead:
    return AccountRead(
        first_name=current_account.first_name,
        last_name=current_account.last_name,
        email=current_account.email,
        subdomain=current_account.subdomain
    )


@router.patch(
    "",
    response_model=AccountRead,
    status_code=http_status.HTTP_200_OK,
    description="Patch account info given account_id"
)
async def patch_account_by_id(
    data: AccountPatch,
    accountCRUD: AccountCRUD = Depends(get_account_crud),
    current_account: Account = Depends(helpers.get_current_account),
) -> AccountRead:
    current_account
    account = await accountCRUD.patch(account_id=current_account.uuid, data=data)

    account_response = AccountRead(
        first_name=account.first_name,
        last_name=account.last_name,
        email=account.email,
        subdomain=account.subdomain
    )
    return account_response


@router.delete(
    "",
    response_model=StatusMessage,
    status_code=http_status.HTTP_200_OK,
    description="Delete a account given account_id"
)
async def delete_account_by_id(
    accountCRUD: AccountCRUD = Depends(get_account_crud),
    current_account: Account = Depends(helpers.get_current_account),
) -> StatusMessage:
    status = await accountCRUD.delete(account_id=current_account.uuid)

    return {"status": status, "message": "The account has been deleted!"}