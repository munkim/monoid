import os
from fastapi import FastAPI, Request, status, Depends, HTTPException
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from mangum import Mangum
import secrets
import sentry_sdk

from monoid_backend.config import settings
from monoid_backend.api.v1.api_models.health_check import HealthCheck
from monoid_backend.api import api_router

# Sentry is an error tracking / profiling platform
# if settings.MONOID_ENVIRONMENT != "local":
if settings.SENTRY_DSN:
    sentry_sdk.init(
        release=settings.version,
        environment=settings.MONOID_ENVIRONMENT,
        dsn=settings.SENTRY_DSN,
        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        traces_sample_rate=1.0,
        # Set profiles_sample_rate to 1.0 to profile 100%
        # of sampled transactions.
        # We recommend adjusting this value in production.
        profiles_sample_rate=0.0,
    )

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    # openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    debug=settings.debug,
    docs_url=settings.docs_url,
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    exc_str = f'{exc}'.replace('\n', ' ').replace('   ', ' ')
    content = {'status_code': 422, 'message': exc_str, 'data': None}
    print(content)
    return JSONResponse(content=content, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


origins = [
    "https://monoid.so",
    "https://www.monoid.so",
    "https://api.monoid.so",
    "https://api-staging.monoid.so",
    "*"
]

if settings.MONOID_ENVIRONMENT == "local" or settings.MONOID_ENVIRONMENT == "staging":
    origins.append("http://localhost")
    origins.append("http://localhost:5174")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # TODO: lockdown to our domain and localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Root endpoint
@app.get("/", response_model=HealthCheck, tags=["status"])
async def health_check():
    return {
        "name": settings.project_name,
        "version": settings.version,
        "description": settings.description
    }


# Load all other endpoints
app.include_router(api_router)

# handler = Mangum(app)
def handler(event, context):

    asgi_handler = Mangum(app)

    authorizer_call = event.get("type", None)

    if authorizer_call and authorizer_call != "REQUEST":
        raise ValueError("There is no way for Mangum to build a scope from a TOKEN authorizer")

    if authorizer_call:
        # trick Mangum and our router
        # by prefixing the path with our authorizer route
        requested_path = event["path"]
        event["path"] = app.url_path_for("authorizer",
                                         requested_path=requested_path)

    response = asgi_handler(event, context)

    if authorizer_call:
        # Only return the body
        return response["body"]

    return response


import uvicorn
import os
if __name__ == "__main__":
  uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))