import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Base
    api_v1_prefix: str = "/api/v1"
    debug: bool = os.environ.get("DEBUG", False)
    project_name: str = "Monoid"
    version: str = os.environ.get("VERSION", "local")
    description: str = "API for Monoid App"
    docs_url: str = os.environ.get("DOCS_URL", "/docs")
    MONOID_ENVIRONMENT: str = os.environ.get("MONOID_ENVIRONMENT")

    # Encoding / Decoding
    JWT_HASH_ALGORITHM: str = os.environ.get("JWT_HASH_ALGORITHM")
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY")

    # External APIs
    OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY")
    SENTRY_DSN: str = os.environ.get("SENTRY_DSN") # Optional

    # Google OAuth
    GOOGLE_OAUTH_CLIENT_ID: str = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
    GOOGLE_OAUTH_CLIENT_SECRET: str = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
    GOOGLE_OAUTH_REDIRECT_URI: str = os.environ.get("GOOGLE_OAUTH_REDIRECT_URI")

    # Database
    DB_ENDPOINT: str = os.environ.get("DB_ENDPOINT") if MONOID_ENVIRONMENT != "local" else "0.0.0.0"
    DB_PORT: str = os.environ.get("DB_PORT") if MONOID_ENVIRONMENT != "local" else "5432"
    DB_USERNAME: str = os.environ.get("DB_USERNAME") if MONOID_ENVIRONMENT != "local" else "postgres"
    DB_PASSWORD: str = os.environ.get("DB_PASSWORD") if MONOID_ENVIRONMENT != "local" else "12341234"
    DB_NAME: str = os.environ.get("DB_NAME") if MONOID_ENVIRONMENT != "local" else "postgres"
    ssl_require: bool = True if MONOID_ENVIRONMENT != "local" else False

    # Optional: Needed for scheduling a message to an Agent via AWS EventBridge. This feature is outdated.
    AWS_ACCOUNT_ID: str = os.environ.get("AWS_ACCOUNT_ID", "")

# Load environment variables from .env file (unless it's for production)
settings = Settings(_env_file=".env") if not os.environ.get("MONOID_ENVIRONMENT") else Settings()