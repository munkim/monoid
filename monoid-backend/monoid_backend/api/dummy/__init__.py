from fastapi import APIRouter

from monoid_backend.api.dummy import (
    dummy
)

api_router = APIRouter()
api_router.include_router(dummy.router, tags=["dummy"])