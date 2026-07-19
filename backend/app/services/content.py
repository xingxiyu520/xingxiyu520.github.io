from datetime import datetime, timedelta, timezone
from hashlib import sha256
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models.article import Article
from app.models.article_view import ArticleView
from app.models.friend_link import FriendLink
from app.models.like import Like
from app.models.project import Project
from app.models.share import Share
from app.models.site_config import SiteConfig
from app.models.taxonomy import Category, Tag
from app.schemas.content import (
    ArticleOut,
    CategoryOut,
    FriendLinkOut,
    LikeOut,
    ProjectOut,
    ShareOut,
    TagOut,
)
from app.utils.slug import slugify

PUBLISHABLE_MODELS = {
    "articles": Article,
    "projects": Project,
    "friend-links": FriendLink,
    "shares": Share,
}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def ensure_unique_slug(db: Session, model: type, raw_slug: str | None, fallback: str, current_id: str | None = None) -> str:
    base_slug = slugify(raw_slug or fallback, fallback_prefix=model.__tablename__.rstrip("s"))
    candidate = base_slug
    index = 2

    while True:
        statement = select(model).where(model.slug == candidate)
        existing = db.scalar(statement)
        if existing is None or getattr(existing, "id", None) == current_id:
            return candidate
        candidate = f"{base_slug[:150]}-{index}"
        index += 1


def get_or_create_category(db: Session, category_type: str, category_id: str | None, category_name: str | None) -> Category:
    if category_id:
        category = db.get(Category, category_id)
        if category is None or category.type != category_type:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="分类不存在")
        return category

    name = (category_name or "默认").strip() or "默认"
    category = db.scalar(select(Category).where(Category.name == name, Category.type == category_type))
    if category is not None:
        return category

    category = Category(name=name, type=category_type, sort_order=0)
    db.add(category)
    db.flush()
    return category


def get_or_create_tags(db: Session, tag_type: str, tag_ids: list[str], tag_names: list[str]) -> list[Tag]:
    tags: list[Tag] = []

    for tag_id in tag_ids:
        tag = db.get(Tag, tag_id)
        if tag is None or tag.type != tag_type:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="标签不存在")
        tags.append(tag)

    existing_names = {tag.name for tag in tags}
    for raw_name in tag_names:
        name = raw_name.strip()
        if not name or name in existing_names:
            continue

        tag = db.scalar(select(Tag).where(Tag.name == name, Tag.type == tag_type))
        if tag is None:
            tag = Tag(name=name, type=tag_type)
            db.add(tag)
            db.flush()

        tags.append(tag)
        existing_names.add(name)

    return tags


def mark_publish_fields(item: Any, status_value: str | None) -> None:
    if status_value == "published" and hasattr(item, "published_at") and getattr(item, "published_at", None) is None:
        item.published_at = now_utc()

    if status_value == "archived":
        item.archived_at = now_utc()
    elif status_value in {"draft", "published", "offline"} and hasattr(item, "archived_at"):
        item.archived_at = None


def article_to_out(article: Article, include_content: bool) -> ArticleOut:
    return ArticleOut(
        id=article.id,
        slug=article.slug,
        title=article.title,
        summary=article.summary,
        content_markdown=article.content_markdown if include_content else None,
        cover_url=article.cover_url,
        category=CategoryOut.model_validate(article.category),
        tags=[TagOut.model_validate(tag) for tag in article.tags],
        status=article.status,
        view_count=article.view_count,
        like_count=article.like_count,
        is_pinned=article.is_pinned,
        sort_order=article.sort_order,
        published_at=article.published_at,
        archived_at=article.archived_at,
        created_at=article.created_at,
        updated_at=article.updated_at,
    )


def share_to_out(share: Share) -> ShareOut:
    return ShareOut(
        id=share.id,
        title=share.title,
        type=share.type,
        external_url=share.external_url,
        description=share.description,
        cover_url=share.cover_url,
        category=CategoryOut.model_validate(share.category),
        tags=[TagOut.model_validate(tag) for tag in share.tags],
        status=share.status,
        sort_order=share.sort_order,
        published_at=share.published_at,
        archived_at=share.archived_at,
        created_at=share.created_at,
        updated_at=share.updated_at,
    )


def article_detail_options() -> tuple:
    return (selectinload(Article.category), selectinload(Article.tags))


def share_detail_options() -> tuple:
    return (selectinload(Share.category), selectinload(Share.tags))


def visible_articles_statement() -> Select[tuple[Article]]:
    return (
        select(Article)
        .options(*article_detail_options())
        .where(Article.status == "published")
        .order_by(Article.is_pinned.desc(), Article.sort_order.desc(), Article.published_at.desc(), Article.created_at.desc())
    )


def visible_shares_statement() -> Select[tuple[Share]]:
    return (
        select(Share)
        .options(*share_detail_options())
        .where(Share.status == "published")
        .order_by(Share.sort_order.desc(), Share.published_at.desc(), Share.created_at.desc())
    )


def record_article_view(db: Session, article: Article, client_ip: str) -> bool:
    settings = get_settings()
    ip_hash = sha256(f"{settings.jwt_secret}:{client_ip}".encode("utf-8")).hexdigest()
    threshold = now_utc() - timedelta(hours=24)

    existing_view = db.scalar(
        select(ArticleView).where(
            ArticleView.article_id == article.id,
            ArticleView.ip_hash == ip_hash,
            ArticleView.viewed_at >= threshold,
        )
    )
    if existing_view is not None:
        return False

    article_view = ArticleView(article_id=article.id, ip_hash=ip_hash, viewed_at=now_utc())
    article.view_count += 1
    db.add(article_view)
    db.add(article)
    db.commit()
    db.refresh(article)
    return True


def client_like_hash(client_key: str) -> str:
    settings = get_settings()
    normalized = client_key.strip()[:240] or "unknown"
    return sha256(f"{settings.jwt_secret}:like:{normalized}".encode("utf-8")).hexdigest()


def get_like_count(db: Session, target_type: str, target_id: str) -> int:
    return int(
        db.scalar(
            select(func.count())
            .select_from(Like)
            .where(Like.target_type == target_type, Like.target_id == target_id)
        )
        or 0
    )


def read_like_status(
    db: Session,
    target_type: str,
    target_id: str,
    client_hash: str,
    count: int | None = None,
) -> LikeOut:
    existing_like = db.scalar(
        select(Like).where(
            Like.target_type == target_type,
            Like.target_id == target_id,
            Like.client_hash == client_hash,
        )
    )

    return LikeOut(
        target_type=target_type,
        target_id=target_id,
        count=get_like_count(db, target_type, target_id) if count is None else count,
        liked=existing_like is not None,
    )


def set_like_state(db: Session, target_type: str, target_id: str, client_hash: str, liked: bool) -> bool:
    existing_like = db.scalar(
        select(Like).where(
            Like.target_type == target_type,
            Like.target_id == target_id,
            Like.client_hash == client_hash,
        )
    )

    if liked:
        if existing_like is not None:
            return False
        db.add(Like(target_type=target_type, target_id=target_id, client_hash=client_hash))
        db.flush()
        return True

    if existing_like is None:
        return False

    db.delete(existing_like)
    db.flush()
    return True


def build_text_search_filter(model: type, query: str):
    pattern = f"%{query}%"
    if model is Article:
        return or_(Article.title.ilike(pattern), Article.summary.ilike(pattern), Article.content_markdown.ilike(pattern))
    if model is Share:
        return or_(Share.title.ilike(pattern), Share.description.ilike(pattern))
    raise ValueError("Unsupported search model")


def get_site_config_map(db: Session) -> dict[str, Any]:
    rows = db.scalars(select(SiteConfig).order_by(SiteConfig.key.asc())).all()
    return {row.key: row.value_json for row in rows}


def upsert_site_config(db: Session, configs: dict[str, Any]) -> dict[str, Any]:
    for key, value in configs.items():
        normalized_key = key.strip()
        if not normalized_key:
            continue

        config = db.scalar(select(SiteConfig).where(SiteConfig.key == normalized_key))
        if config is None:
            config = SiteConfig(key=normalized_key, value_json=value)
            db.add(config)
        else:
            config.value_json = value
            db.add(config)

    db.commit()
    return get_site_config_map(db)


def count_model(db: Session, model: type, published_only: bool = False) -> int:
    statement = select(func.count()).select_from(model)
    if published_only and hasattr(model, "status"):
        statement = statement.where(model.status == "published")
    return int(db.scalar(statement) or 0)
