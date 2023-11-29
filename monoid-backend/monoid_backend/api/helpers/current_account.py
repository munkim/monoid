from fastapi import Depends, HTTPException, Request, status
from monoid_backend.crud.auth_crud import AuthCRUD, get_auth_crud
from monoid_backend.crud.account_crud import AccountCRUD, get_account_crud
from monoid_backend.db_models.account import Account

async def get_current_account(
    request: Request,
    auth: AuthCRUD = Depends(get_auth_crud),
) -> Account:
    session_token = request.headers.get('x-session-token')
    account = await auth.get_account_by_token(session_token or '')

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid Session Token"
        )
    
    return account