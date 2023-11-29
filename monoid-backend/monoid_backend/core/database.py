from os import getenv
from sys import modules
import boto3
import asyncpg
# import psycopg2

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from monoid_backend.config import settings

#gets the credentials from .aws/credentials
client = boto3.client('rds')
db_async_connection_str: str = f"postgresql+asyncpg://{settings.DB_USERNAME}:{settings.DB_PASSWORD}@{settings.DB_ENDPOINT}:{settings.DB_PORT}/{settings.DB_NAME}{'?ssl=require' if settings.ssl_require else ''}"
async_engine = create_async_engine(
    db_async_connection_str,
    echo=True,
    future=True
)

async def get_async_session() -> AsyncSession:
    async_session = sessionmaker(
        bind=async_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session