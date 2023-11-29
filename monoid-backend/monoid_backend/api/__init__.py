from fastapi import APIRouter

from monoid_backend.api import v1, dummy

api_router = APIRouter()
api_router.include_router(v1.api_router, prefix='/v1')
api_router.include_router(dummy.api_router, prefix='/dummy')