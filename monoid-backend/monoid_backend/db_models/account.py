import uuid
from sqlalchemy import Boolean, Column, Integer, Sequence, String, DateTime, ForeignKey, Table, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from monoid_backend.db_models.base_class import Base

class Account(Base):
    id = Column(Integer, autoincrement=True, primary_key=True, index=True, unique=True)
    uuid = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4, unique=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, unique=True, nullable=False)
    subdomain = Column(String, index=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    auth = relationship("Auth", back_populates="account")


class SignUp(Base):
    id = Column(Integer, autoincrement=True, primary_key=True, index=True, unique=True)
    company_name = Column(String)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())