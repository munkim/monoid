from datetime import datetime
import uuid
from typing import Optional
from pydantic import BaseModel


class AuthBase(BaseModel):
    session_token: uuid.UUID
    access_token: str
    refresh_token: str
    account_id: int
    subdomain: str


class AuthCreate(AuthBase):
    pass


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[int] = None


# When account clicks "Continue with <Provider" button
class GoogleAuthorizePayload(BaseModel):
    code: str
    debug: bool = False


class AuthorizeResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    session_token: Optional[uuid.UUID] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    subdomain: Optional[str] = None
