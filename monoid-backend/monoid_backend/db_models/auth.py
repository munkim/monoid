from sqlalchemy import UUID, Boolean, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from monoid_backend.db_models.base_class import Base

class Auth(Base):
    id = Column(Integer, primary_key=True, index=True)
    
    # OAuth Provider (e.g. Google/Github) provides access_token and refresh_token
    # We should never transmit these tokens to the FE
    access_token = Column(String, index=True)
    refresh_token = Column(String, index=False)

    # Instead, we generate our own session_token for FE authentication
    session_token = Column(UUID(as_uuid=True), index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True))

    # Relationships
    account_id = Column(Integer, ForeignKey("account.id"))
    account = relationship("Account", back_populates="auth")