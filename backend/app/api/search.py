from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_password_ready_admin
from app.db.session import get_db
from app.models.admin import Admin
from app.models.article import Article
from app.models.share import Share
from app.schemas.content import ArticleOut, ShareOut
from app.services.content import (
    article_detail_options,
    article_to_out,
    build_text_search_filter,
    share_detail_options,
    share_to_out,
)

router = APIRouter(tags=["search"])


def run_search(db: Session, q: str, include_unpublished: bool = False) -> dict[str, list[ArticleOut | ShareOut]]:
    article_statement = select(Article).options(*article_detail_options()).where(build_text_search_filter(Article, q))
    share_statement = select(Share).options(*share_detail_options()).where(build_text_search_filter(Share, q))

    if not include_unpublished:
        article_statement = article_statement.where(Article.status == "published")
        share_statement = share_statement.where(Share.status == "published")

    article_statement = article_statement.order_by(Article.published_at.desc(), Article.updated_at.desc()).limit(20)
    share_statement = share_statement.order_by(Share.published_at.desc(), Share.updated_at.desc()).limit(20)

    articles = [article_to_out(article, include_content=False) for article in db.scalars(article_statement).unique().all()]
    shares = [share_to_out(share) for share in db.scalars(share_statement).unique().all()]
    return {"articles": articles, "shares": shares}


@router.get("/search")
def public_search(
    db: Annotated[Session, Depends(get_db)],
    q: str = Query(min_length=1, max_length=80),
) -> dict[str, list[ArticleOut | ShareOut]]:
    return run_search(db, q, include_unpublished=False)


@router.get("/admin/search")
def admin_search(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
    q: str = Query(min_length=1, max_length=80),
) -> dict[str, list[ArticleOut | ShareOut]]:
    return run_search(db, q, include_unpublished=True)
