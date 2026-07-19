from typing import Any

from pydantic import BaseModel


class SiteConfigUpdate(BaseModel):
    configs: dict[str, Any]


class SiteConfigOut(BaseModel):
    configs: dict[str, Any]
