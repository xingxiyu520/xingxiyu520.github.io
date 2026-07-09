from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.article import Article
from app.models.friend_link import FriendLink
from app.models.project import Project
from app.models.share import Share
from app.models.taxonomy import Category, Tag
from app.schemas.content import ArticleOut, FriendLinkOut, ProjectOut, ShareOut
from app.schemas.site import SiteConfigOut
from app.services.content import (
    article_detail_options,
    article_to_out,
    get_site_config_map,
    record_article_view,
    share_to_out,
    visible_articles_statement,
    visible_shares_statement,
)
from app.utils.request import get_client_ip

router = APIRouter(tags=["public"])


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
    article = db.scalar(
        select(Article)
        .options(*article_detail_options())
        .where(Article.slug == slug, Article.status == "published")
    )
    if article is None:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在")

    record_article_view(db, article, get_client_ip(request))
    db.refresh(article)
    return article_to_out(article, include_content=True)


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
