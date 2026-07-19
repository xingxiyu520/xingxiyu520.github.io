from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.article import Article
from app.models.friend_link import FriendLink
from app.models.project import Project
from app.models.share import Share
from app.models.taxonomy import Category, Tag
from app.schemas.content import ArticleOut, FriendLinkOut, LikeOut, OutboundClickCreate, PageViewCreate, ProjectOut, ShareOut
from app.schemas.site import SiteConfigOut
from app.services.content import (
    article_detail_options,
    article_to_out,
    client_like_hash,
    get_site_config_map,
    read_like_status,
    record_analytics_event,
    record_article_view,
    set_like_state,
    share_to_out,
    visible_articles_statement,
    visible_shares_statement,
)
from app.utils.request import get_client_ip

router = APIRouter(tags=["public"])

SITE_LIKE_TARGET_ID = "site"


def get_public_article_or_404(db: Session, slug: str) -> Article:
    article = db.scalar(
        select(Article)
        .options(*article_detail_options())
        .where(Article.slug == slug, Article.status == "published")
    )
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在")
    return article


def get_request_like_hash(request: Request) -> str:
    client_id = request.headers.get("x-like-client-id")
    if client_id and client_id.strip():
        return client_like_hash(f"client:{client_id}")
    return client_like_hash(f"ip:{get_client_ip(request)}")


def get_request_client_key(request: Request) -> str:
    client_id = request.headers.get("x-analytics-client-id") or request.headers.get("x-like-client-id")
    if client_id and client_id.strip():
        return f"client:{client_id}"
    return f"ip:{get_client_ip(request)}"


@router.get("/articles", response_model=list[ArticleOut])
def list_articles(
    db: Annotated[Session, Depends(get_db)],
    category: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[ArticleOut]:
    statement = visible_articles_statement()

    if category:
        statement = statement.join(Article.category).where(Category.name == category)
    if tag:
        statement = statement.join(Article.tags).where(Tag.name == tag)

    articles = db.scalars(statement.offset(offset).limit(limit)).unique().all()
    return [article_to_out(article, include_content=False) for article in articles]


@router.get("/articles/{slug}", response_model=ArticleOut)
def read_article(
    slug: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> ArticleOut:
    article = get_public_article_or_404(db, slug)
    record_article_view(db, article, get_client_ip(request))
    db.refresh(article)
    return article_to_out(article, include_content=True)


@router.post("/analytics/page-view")
def record_page_view(
    payload: PageViewCreate,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_analytics_event(
        db,
        event_type="page_view",
        client_key=get_request_client_key(request),
        client_ip=get_client_ip(request),
        path=payload.path,
        referrer=payload.referrer,
    )
    return {"status": "ok"}


@router.post("/analytics/outbound-click")
def record_outbound_click(
    payload: OutboundClickCreate,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_analytics_event(
        db,
        event_type="outbound_click",
        client_key=get_request_client_key(request),
        client_ip=get_client_ip(request),
        path=payload.path,
        referrer=payload.referrer,
        target_type=payload.target_type,
        target_id=payload.target_id,
        target_url=payload.target_url,
    )
    return {"status": "ok"}


@router.get("/site/like", response_model=LikeOut)
def read_site_like(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> LikeOut:
    return read_like_status(db, "site", SITE_LIKE_TARGET_ID, get_request_like_hash(request))


@router.post("/site/like", response_model=LikeOut)
def like_site(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> LikeOut:
    client_hash = get_request_like_hash(request)
    changed = set_like_state(db, "site", SITE_LIKE_TARGET_ID, client_hash, liked=True)
    if changed:
        db.commit()
    return read_like_status(db, "site", SITE_LIKE_TARGET_ID, client_hash)


@router.delete("/site/like", response_model=LikeOut)
def unlike_site(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> LikeOut:
    client_hash = get_request_like_hash(request)
    changed = set_like_state(db, "site", SITE_LIKE_TARGET_ID, client_hash, liked=False)
    if changed:
        db.commit()
    return read_like_status(db, "site", SITE_LIKE_TARGET_ID, client_hash)


@router.get("/articles/{slug}/like", response_model=LikeOut)
def read_article_like(
    slug: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> LikeOut:
    article = get_public_article_or_404(db, slug)
    return read_like_status(db, "article", article.id, get_request_like_hash(request), count=article.like_count)


@router.post("/articles/{slug}/like", response_model=LikeOut)
def like_article(
    slug: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> LikeOut:
    article = get_public_article_or_404(db, slug)
    client_hash = get_request_like_hash(request)
    changed = set_like_state(db, "article", article.id, client_hash, liked=True)
    if changed:
        article.like_count += 1
        db.add(article)
        db.commit()
        db.refresh(article)
    return read_like_status(db, "article", article.id, client_hash, count=article.like_count)


@router.delete("/articles/{slug}/like", response_model=LikeOut)
def unlike_article(
    slug: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> LikeOut:
    article = get_public_article_or_404(db, slug)
    client_hash = get_request_like_hash(request)
    changed = set_like_state(db, "article", article.id, client_hash, liked=False)
    if changed:
        article.like_count = max(0, article.like_count - 1)
        db.add(article)
        db.commit()
        db.refresh(article)
    return read_like_status(db, "article", article.id, client_hash, count=article.like_count)


@router.get("/projects", response_model=list[ProjectOut])
def list_projects(
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[Project]:
    statement = (
        select(Project)
        .where(Project.status == "published")
        .order_by(Project.sort_order.desc(), Project.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(db.scalars(statement).all())


@router.get("/friend-links", response_model=list[FriendLinkOut])
def list_friend_links(db: Annotated[Session, Depends(get_db)]) -> list[FriendLink]:
    statement = (
        select(FriendLink)
        .where(FriendLink.status == "published", FriendLink.is_visible.is_(True))
        .order_by(FriendLink.sort_order.desc(), FriendLink.created_at.desc())
    )
    return list(db.scalars(statement).all())


@router.get("/shares", response_model=list[ShareOut])
def list_shares(
    db: Annotated[Session, Depends(get_db)],
    category: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    type: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[ShareOut]:
    statement = visible_shares_statement()

    if category:
        statement = statement.join(Share.category).where(Category.name == category)
    if tag:
        statement = statement.join(Share.tags).where(Tag.name == tag)
    if type:
        statement = statement.where(Share.type == type)

    shares = db.scalars(statement.offset(offset).limit(limit)).unique().all()
    return [share_to_out(share) for share in shares]


@router.get("/site-config", response_model=SiteConfigOut)
def read_site_config(db: Annotated[Session, Depends(get_db)]) -> SiteConfigOut:
    return SiteConfigOut(configs=get_site_config_map(db))
