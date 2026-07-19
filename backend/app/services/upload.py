from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.uploaded_file import UploadedFile
from app.utils.slug import slugify

IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024
AUDIO_UPLOAD_MAX_BYTES = 20 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".m4a"}
ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_AUDIO_MIME_TYPES = {"audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a"}


def normalize_upload_subdir(owner_type: str | None, owner_id: str | None, article_slug: str | None) -> Path:
    if owner_type == "article":
        article_folder = slugify(article_slug or owner_id, fallback_prefix="article")
        return Path("articles") / article_folder

    if owner_type == "music":
        return Path("music")

    if owner_type:
        return Path(slugify(owner_type, fallback_prefix="misc"))

    return Path("misc")


def upload_limits_for_file(extension: str, mime_type: str) -> tuple[int, set[str], str]:
    if extension in ALLOWED_IMAGE_EXTENSIONS and mime_type in ALLOWED_IMAGE_MIME_TYPES:
        return IMAGE_UPLOAD_MAX_BYTES, ALLOWED_IMAGE_MIME_TYPES, "图片"

    if extension in ALLOWED_AUDIO_EXTENSIONS and mime_type in ALLOWED_AUDIO_MIME_TYPES:
        return AUDIO_UPLOAD_MAX_BYTES, ALLOWED_AUDIO_MIME_TYPES, "音频"

    allowed_extensions = sorted(ALLOWED_IMAGE_EXTENSIONS | ALLOWED_AUDIO_EXTENSIONS)
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"只支持这些文件类型：{', '.join(allowed_extensions)}",
    )


async def save_uploaded_file(
    db: Session,
    upload: UploadFile,
    owner_type: str | None = None,
    owner_id: str | None = None,
    article_slug: str | None = None,
) -> UploadedFile:
    original_name = upload.filename or "upload"
    extension = Path(original_name).suffix.lower()
    mime_type = upload.content_type or ""
    max_upload_bytes, _, file_label = upload_limits_for_file(extension, mime_type)

    data = await upload.read(max_upload_bytes + 1)
    if len(data) > max_upload_bytes:
        max_mb = max_upload_bytes // 1024 // 1024
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"{file_label}文件不能超过 {max_mb}MB")

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


async def save_uploaded_image(
    db: Session,
    upload: UploadFile,
    owner_type: str | None = None,
    owner_id: str | None = None,
    article_slug: str | None = None,
) -> UploadedFile:
    return await save_uploaded_file(db, upload, owner_type=owner_type, owner_id=owner_id, article_slug=article_slug)


def delete_uploaded_file(db: Session, uploaded_file: UploadedFile) -> None:
    settings = get_settings()
    relative_url = uploaded_file.url.removeprefix(settings.public_upload_base_url.rstrip("/")).lstrip("/")
    target_path = (settings.upload_path / relative_url).resolve()
    upload_root = settings.upload_path.resolve()

    if upload_root in target_path.parents and target_path.exists():
        target_path.unlink()

    db.delete(uploaded_file)
    db.commit()
