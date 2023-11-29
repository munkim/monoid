from fastapi import APIRouter

from monoid_backend.api.v1 import (
    account,
    configured_action,
    api_action,
    auth,
    action,
    chat_session,
    agent,
    agent_schedule
)

api_router = APIRouter()
api_router.include_router(account.router, prefix="/account", tags=["account"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(agent.router, prefix="/agent", tags=["agent"])
api_router.include_router(configured_action.router, prefix="/agent", tags=["agent"])
api_router.include_router(agent_schedule.router, prefix="/agent", tags=["agent"])
api_router.include_router(action.router, prefix="/action", tags=["action"])
api_router.include_router(api_action.router, prefix="/api-action", tags=["action"])
api_router.include_router(chat_session.router, prefix="/chat-session", tags=["chat-session"])
