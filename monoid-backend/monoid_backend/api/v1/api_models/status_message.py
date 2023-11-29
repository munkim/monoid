from pydantic import BaseModel

class StatusMessage(BaseModel):
    status: bool
    message: str