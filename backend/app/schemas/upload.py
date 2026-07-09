from datetime import datetime

from pydantic import BaseModel


class UploadedFileOut(BaseModel):
    id: str
    original_name: str
    stored_name: str
    url: str
    mime_type: str
    size_bytes: int
    owner_type: str | None
    owner_id: str | None
    created_at: datetime
    updated_at: datetime
