import uuid
from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, EmailStr, Json


class AccountBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr = None

# Properties to receive via API on creation
class AccountRead(AccountBase):
    subdomain: str
    session_token: Optional[uuid.UUID] = None

# Signup form
class SignupForm(BaseModel):
    company_name: Optional[str] = None
    email: str


# Properties to receive via API on read
class AccountCreate(AccountBase):
    pass

# Properties to receive via API on patch
class AccountPatch(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
