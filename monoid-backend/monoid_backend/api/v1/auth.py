import os
import uuid
from datetime import datetime
from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, Request
from fastapi import status as http_status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sentry_sdk import capture_exception
from google.auth.transport import requests as google_auth_requests
from google.oauth2 import id_token
from monoid_backend.api.v1.api_models.auth import AuthCreate, GoogleAuthorizePayload, AuthorizeResponse
from monoid_backend.api.v1.api_models.account import AccountCreate
from monoid_backend.crud.auth_crud import AuthCRUD, get_auth_crud
from monoid_backend.crud.account_crud import AccountCRUD, get_account_crud
from monoid_backend.config import settings
from cassandra.cluster import Session as CassandraSession
from monoid_backend.core.cassandra import get_cassandra_session

router = APIRouter()

# POST /auth/google - Google OAuth2 login
@router.post(
    "/google", 
    response_model=AuthorizeResponse, 
    status_code=http_status.HTTP_201_CREATED,
    description="Exchange Authorization Code for Access Token"
)
async def google_authorize(
    request: GoogleAuthorizePayload,
    accountCRUD: AccountCRUD = Depends(get_account_crud),
    authCRUD: AuthCRUD = Depends(get_auth_crud),
    cassandra_session: CassandraSession = Depends(get_cassandra_session),
) -> AuthorizeResponse:
    token_endpoint = 'https://oauth2.googleapis.com/token'
    google_oauth_client_id = settings.GOOGLE_OAUTH_CLIENT_ID
    google_oauth_client_secret = settings.GOOGLE_OAUTH_CLIENT_SECRET
    google_oauth_redirect_uri = "http://localhost:5174" if request.debug else settings.GOOGLE_OAUTH_REDIRECT_URI

    token_response = google_auth_requests.requests.post(
        token_endpoint,
        data={
            "code": request.code,
            "client_id": google_oauth_client_id,
            "client_secret": google_oauth_client_secret,
            "redirect_uri": google_oauth_redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=5
    )

    if token_response.status_code != 200:
        return AuthorizeResponse(
            success=False, 
            error='Unable to authorize'
        )
    
    token_data = token_response.json()

    id_token_str = token_data['id_token']
    id_token_info = id_token.verify_oauth2_token(
        id_token_str,
        google_auth_requests.Request(),
        google_oauth_client_id,
        clock_skew_in_seconds=30,
    )

    access_token = token_data.get('access_token')
    refresh_token = token_data.get('refresh_token')
    email = id_token_info.get('email')
    given_name = id_token_info.get('given_name')
    family_name = id_token_info.get('family_name')
    expiration = id_token_info.get('exp')

    # find account by email
    account_by_email = await accountCRUD.get_by_email(email=email)

    # create if not exists
    if account_by_email is None:
        account_by_email = await accountCRUD.create(
            data=AccountCreate(
                email=email,
                first_name=given_name,
                last_name=family_name
            )
        )

    # then create new auth record
    session_token = uuid.uuid4()

    await authCRUD.create(
        data=AuthCreate(
            session_token=session_token,
            access_token=access_token,
            refresh_token=refresh_token,
            account_id=account_by_email.id,
            subdomain=account_by_email.subdomain,
        )
    )
    auth_response = AuthorizeResponse(
        success=True, 
        session_token=session_token,
        first_name=given_name,
        last_name=family_name,
        email=email,
        subdomain=account_by_email.subdomain,
    )

    response = JSONResponse(content=jsonable_encoder(auth_response))
    response.set_cookie(key="x-session-token-cookie", value=session_token)

    # finally, return the access token
    return response

# POST /auth/google/refresh - Google OAuth2 refresh token
