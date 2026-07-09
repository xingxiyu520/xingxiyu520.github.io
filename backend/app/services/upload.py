from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.uploaded_file import UploadedFile
from app.utils.slug import slugify

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def normalize_upload_subdir(owner_type: str | None, owner_id: str | None, article_slug: str | None) -> Path:
    if owner_type == "article":
        article_folder = slugify(article_slug or owner_id, fallback_prefix="article")
        return Path("articles") / article_folder

    if owner_type:
        return Path(slugify(owner_type, fallback_prefix="misc"))

    return Path("misc")


async def save_uploaded_image(
    db: Session,
    upload: UploadFile,
    owner_type: str | None = None,
    owner_id: str | None = None,
    article_slug: str | None = None,
) -> UploadedFile:
    original_name = upload.filename or "upload"
    extension = Path(original_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只支持 jpg、png、webp、gif 图片")

    mime_type = upload.content_type or ""
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="图片 MIME 类型不合法")

    data = await upload.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="单文件不能超过 5MB")

    settings = get_settings()
    subdir = normalize_upload_subdir(owner_type, owner_id, article_slug)
    target_dir = settings.upload_path / subdir
    target_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid4().hex}{extension}"
    target_path = target_dir / stored_name
    target_path.write_bytes(data)

    url_path = "/".join([settings.public_upload_base_url.rstrip("/"), *subdir.parts, stored_name])
    uploaded_file = UploadedFile(
        original_name=original_name,
        stored_name=stored_name,
        url=url_path,
        mime_type=mime_type,
        size_bytes=len(data),
        owner_type=owner_type,
        owner_id=owner_id,
    )
    db.add(uploaded_file)
    db.commit()
    db.refresh(uploaded_file)
    return uploaded_file
