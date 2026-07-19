from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UploadedFileOut(BaseModel):
    id: str
    original_name: str
    stored_name: str
    url: str
    mime_type: str
    size_bytes: int
    owner_type: str | None
    owner_id: str | None
    is_used: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
