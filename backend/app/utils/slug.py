import re
from uuid import uuid4


def slugify(value: str | None, fallback_prefix: str = "item") -> str:
    source = (value or "").strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", source).strip("-")

    if slug:
        return slug[:160]

    return f"{fallback_prefix}-{uuid4().hex[:8]}"
