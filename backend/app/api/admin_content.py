from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_password_ready_admin
from app.db.session import get_db
from app.models.admin import Admin
from app.models.article import Article
from app.models.friend_link import FriendLink
from app.models.project import Project
from app.models.share import Share
from app.models.taxonomy import Category, Tag
from app.schemas.content import (
    ArticleCreate,
    ArticleOut,
    ArticleUpdate,
    CategoryCreate,
    CategoryOut,
    DashboardOut,
    FriendLinkCreate,
    FriendLinkOut,
    FriendLinkUpdate,
    ProjectCreate,
    ProjectOut,
    ProjectUpdate,
    RestoreRequest,
    ShareCreate,
    ShareOut,
    ShareUpdate,
    TagCreate,
    TagOut,
)
from app.schemas.site import SiteConfigOut, SiteConfigUpdate
from app.schemas.upload import UploadedFileOut
from app.services.content import (
    PUBLISHABLE_MODELS,
    article_detail_options,
    article_to_out,
    build_text_search_filter,
    count_model,
    ensure_unique_slug,
    get_or_create_category,
    get_or_create_tags,
    get_site_config_map,
    mark_publish_fields,
    share_detail_options,
    share_to_out,
    upsert_site_config,
)
from app.services.upload import save_uploaded_image
from app.utils.markdown import title_from_markdown

router = APIRouter(prefix="/admin", tags=["admin-content"])


def apply_simple_updates(item: Any, updates: dict[str, Any], fields: set[str]) -> None:
    for field in fields:
        if field in updates:
            setattr(item, field, updates[field])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> DashboardOut:
    recent_items: list[dict[str, Any]] = []
    for label, model, title_attr in [
        ("article", Article, "title"),
        ("project", Project, "name"),
        ("friend_link", FriendLink, "name"),
        ("share", Share, "title"),
    ]:
        rows = db.scalars(select(model).order_by(model.updated_at.desc()).limit(5)).all()
        for row in rows:
            recent_items.append(
                {
                    "type": label,
                    "id": row.id,
                    "title": getattr(row, title_attr),
                    "status": getattr(row, "status", None),
                    "updated_at": row.updated_at.isoformat(),
                }
            )

    recent_items.sort(key=lambda item: item["updated_at"], reverse=True)

    return DashboardOut(
        article_count=count_model(db, Article),
        project_count=count_model(db, Project),
        friend_link_count=count_model(db, FriendLink),
        share_count=count_model(db, Share),
        total_view_count=int(db.scalar(select(func.coalesce(func.sum(Article.view_count), 0))) or 0),
        draft_count=int(
            (db.scalar(select(func.count()).select_from(Article).where(Article.status == "draft")) or 0)
            + (db.scalar(select(func.count()).select_from(Project).where(Project.status == "draft")) or 0)
            + (db.scalar(select(func.count()).select_from(Share).where(Share.status == "draft")) or 0)
        ),
        published_count=int(
            (db.scalar(select(func.count()).select_from(Article).where(Article.status == "published")) or 0)
            + (db.scalar(select(func.count()).select_from(Project).where(Project.status == "published")) or 0)
            + (db.scalar(select(func.count()).select_from(FriendLink).where(FriendLink.status == "published")) or 0)
            + (db.scalar(select(func.count()).select_from(Share).where(Share.status == "published")) or 0)
        ),
        recent_updates=recent_items[:10],
    )


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
    type: str | None = Query(default=None),
) -> list[Category]:
    statement = select(Category).order_by(Category.type.asc(), Category.sort_order.desc(), Category.name.asc())
    if type:
        statement = statement.where(Category.type == type)
    return list(db.scalars(statement).all())


@router.post("/categories", response_model=CategoryOut)
def create_category(
    payload: CategoryCreate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> Category:
    category = get_or_create_category(db, payload.type, None, payload.name)
    category.sort_order = payload.sort_order
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/tags", response_model=list[TagOut])
def list_tags(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
    type: str | None = Query(default=None),
) -> list[Tag]:
    statement = select(Tag).order_by(Tag.type.asc(), Tag.name.asc())
    if type:
        statement = statement.where(Tag.type == type)
    return list(db.scalars(statement).all())


@router.post("/tags", response_model=TagOut)
def create_tag(
    payload: TagCreate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> Tag:
    tag = get_or_create_tags(db, payload.type, [], [payload.name])[0]
    db.commit()
    db.refresh(tag)
    return tag


@router.get("/articles", response_model=list[ArticleOut])
def admin_list_articles(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None),
) -> list[ArticleOut]:
    statement = select(Article).options(*article_detail_options()).order_by(Article.updated_at.desc())
    if status_filter:
        statement = statement.where(Article.status == status_filter)
    if q:
        statement = statement.where(build_text_search_filter(Article, q))
    articles = db.scalars(statement).unique().all()
    return [article_to_out(article, include_content=True) for article in articles]


@router.post("/articles", response_model=ArticleOut)
def create_article(
    payload: ArticleCreate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> ArticleOut:
    category = get_or_create_category(db, "article", payload.category_id, payload.category_name)
    article = Article(
        slug=ensure_unique_slug(db, Article, payload.slug, payload.title),
        title=payload.title,
        summary=payload.summary,
        content_markdown=payload.content_markdown,
        cover_url=payload.cover_url,
        category=category,
        status=payload.status,
        is_pinned=payload.is_pinned,
        sort_order=payload.sort_order,
        published_at=payload.published_at,
    )
    mark_publish_fields(article, payload.status)
    article.tags = get_or_create_tags(db, "article", payload.tag_ids, payload.tag_names)
    db.add(article)
    db.commit()
    db.refresh(article)
    article = db.scalar(select(Article).options(*article_detail_options()).where(Article.id == article.id))
    return article_to_out(article, include_content=True)


@router.put("/articles/{article_id}", response_model=ArticleOut)
def update_article(
    article_id: str,
    payload: ArticleUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> ArticleOut:
    article = db.scalar(select(Article).options(*article_detail_options()).where(Article.id == article_id))
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在")

    updates = payload.model_dump(exclude_unset=True)
    if "slug" in updates and updates["slug"] is not None:
        article.slug = ensure_unique_slug(db, Article, updates["slug"], article.title, current_id=article.id)
    if "category_id" in updates or "category_name" in updates:
        article.category = get_or_create_category(db, "article", updates.get("category_id"), updates.get("category_name"))
    if "tag_ids" in updates or "tag_names" in updates:
        article.tags = get_or_create_tags(db, "article", updates.get("tag_ids") or [], updates.get("tag_names") or [])

    apply_simple_updates(
        article,
        updates,
        {"title", "summary", "content_markdown", "cover_url", "status", "is_pinned", "sort_order", "published_at"},
    )
    mark_publish_fields(article, updates.get("status"))
    db.add(article)
    db.commit()
    article = db.scalar(select(Article).options(*article_detail_options()).where(Article.id == article.id))
    return article_to_out(article, include_content=True)


@router.post("/articles/import-md", response_model=ArticleOut)
async def import_markdown_article(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
    file: UploadFile = File(...),
    category_name: str = Form(default="默认"),
) -> ArticleOut:
    filename = file.filename or "untitled.md"
    if not filename.lower().endswith(".md"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只支持 .md 文件")

    content = (await file.read()).decode("utf-8-sig")
    title = title_from_markdown(content, filename)
    category = get_or_create_category(db, "article", None, category_name)
    article = Article(
        slug=ensure_unique_slug(db, Article, None, title),
        title=title,
        summary=None,
        content_markdown=content,
        category=category,
        status="draft",
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    article = db.scalar(select(Article).options(*article_detail_options()).where(Article.id == article.id))
    return article_to_out(article, include_content=True)


@router.get("/projects", response_model=list[ProjectOut])
def admin_list_projects(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[Project]:
    statement = select(Project).order_by(Project.sort_order.desc(), Project.updated_at.desc())
    if status_filter:
        statement = statement.where(Project.status == status_filter)
    return list(db.scalars(statement).all())


@router.post("/projects", response_model=ProjectOut)
def create_project(
    payload: ProjectCreate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> Project:
    project = Project(
        name=payload.name,
        slug=ensure_unique_slug(db, Project, payload.slug, payload.name),
        description=payload.description,
        cover_url=payload.cover_url,
        tech_stack=payload.tech_stack,
        github_url=payload.github_url,
        demo_url=payload.demo_url,
        status=payload.status,
        sort_order=payload.sort_order,
    )
    mark_publish_fields(project, payload.status)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put("/projects/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="项目不存在")

    updates = payload.model_dump(exclude_unset=True)
    if "slug" in updates and updates["slug"] is not None:
        project.slug = ensure_unique_slug(db, Project, updates["slug"], project.name, current_id=project.id)
    apply_simple_updates(
        project,
        updates,
        {"name", "description", "cover_url", "tech_stack", "github_url", "demo_url", "status", "sort_order"},
    )
    mark_publish_fields(project, updates.get("status"))
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/friend-links", response_model=list[FriendLinkOut])
def admin_list_friend_links(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[FriendLink]:
    statement = select(FriendLink).order_by(FriendLink.sort_order.desc(), FriendLink.updated_at.desc())
    if status_filter:
        statement = statement.where(FriendLink.status == status_filter)
    return list(db.scalars(statement).all())


@router.post("/friend-links", response_model=FriendLinkOut)
def create_friend_link(
    payload: FriendLinkCreate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> FriendLink:
    friend_link = FriendLink(**payload.model_dump())
    mark_publish_fields(friend_link, payload.status)
    db.add(friend_link)
    db.commit()
    db.refresh(friend_link)
    return friend_link


@router.put("/friend-links/{friend_link_id}", response_model=FriendLinkOut)
def update_friend_link(
    friend_link_id: str,
    payload: FriendLinkUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> FriendLink:
    friend_link = db.get(FriendLink, friend_link_id)
    if friend_link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="友链不存在")

    updates = payload.model_dump(exclude_unset=True)
    apply_simple_updates(
        friend_link,
        updates,
        {"name", "url", "avatar_url", "description", "is_visible", "status", "sort_order"},
    )
    mark_publish_fields(friend_link, updates.get("status"))
    db.add(friend_link)
    db.commit()
    db.refresh(friend_link)
    return friend_link


@router.get("/shares", response_model=list[ShareOut])
def admin_list_shares(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None),
) -> list[ShareOut]:
    statement = select(Share).options(*share_detail_options()).order_by(Share.updated_at.desc())
    if status_filter:
        statement = statement.where(Share.status == status_filter)
    if q:
        statement = statement.where(build_text_search_filter(Share, q))
    shares = db.scalars(statement).unique().all()
    return [share_to_out(share) for share in shares]


@router.post("/shares", response_model=ShareOut)
def create_share(
    payload: ShareCreate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> ShareOut:
    category = get_or_create_category(db, "share", payload.category_id, payload.category_name)
    share = Share(
        title=payload.title,
        type=payload.type,
        external_url=payload.external_url,
        description=payload.description,
        cover_url=payload.cover_url,
        category=category,
        status=payload.status,
        sort_order=payload.sort_order,
        published_at=payload.published_at,
    )
    mark_publish_fields(share, payload.status)
    share.tags = get_or_create_tags(db, "share", payload.tag_ids, payload.tag_names)
    db.add(share)
    db.commit()
    share = db.scalar(select(Share).options(*share_detail_options()).where(Share.id == share.id))
    return share_to_out(share)


@router.put("/shares/{share_id}", response_model=ShareOut)
def update_share(
    share_id: str,
    payload: ShareUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> ShareOut:
    share = db.scalar(select(Share).options(*share_detail_options()).where(Share.id == share_id))
    if share is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="分享不存在")

    updates = payload.model_dump(exclude_unset=True)
    if "category_id" in updates or "category_name" in updates:
        share.category = get_or_create_category(db, "share", updates.get("category_id"), updates.get("category_name"))
    if "tag_ids" in updates or "tag_names" in updates:
        share.tags = get_or_create_tags(db, "share", updates.get("tag_ids") or [], updates.get("tag_names") or [])

    apply_simple_updates(
        share,
        updates,
        {"title", "type", "external_url", "description", "cover_url", "status", "sort_order", "published_at"},
    )
    mark_publish_fields(share, updates.get("status"))
    db.add(share)
    db.commit()
    share = db.scalar(select(Share).options(*share_detail_options()).where(Share.id == share.id))
    return share_to_out(share)


@router.get("/site-config", response_model=SiteConfigOut)
def admin_read_site_config(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> SiteConfigOut:
    return SiteConfigOut(configs=get_site_config_map(db))


@router.put("/site-config", response_model=SiteConfigOut)
def admin_update_site_config(
    payload: SiteConfigUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> SiteConfigOut:
    return SiteConfigOut(configs=upsert_site_config(db, payload.configs))


@router.post("/upload", response_model=UploadedFileOut)
async def upload_image(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
    file: UploadFile = File(...),
    owner_type: str | None = Form(default=None),
    owner_id: str | None = Form(default=None),
    article_slug: str | None = Form(default=None),
) -> Any:
    return await save_uploaded_image(db, file, owner_type=owner_type, owner_id=owner_id, article_slug=article_slug)


@router.post("/{resource_type}/{item_id}/archive")
def archive_item(
    resource_type: str,
    item_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> dict[str, str]:
    model = PUBLISHABLE_MODELS.get(resource_type)
    if model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="资源类型不存在")

    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="内容不存在")

    item.status = "archived"
    item.archived_at = datetime.now(timezone.utc)
    db.add(item)
    db.commit()
    return {"status": "ok"}


@router.post("/{resource_type}/{item_id}/restore")
def restore_item(
    resource_type: str,
    item_id: str,
    payload: RestoreRequest,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
) -> dict[str, str]:
    model = PUBLISHABLE_MODELS.get(resource_type)
    if model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="资源类型不存在")

    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="内容不存在")

    item.status = payload.target_status
    item.archived_at = None
    mark_publish_fields(item, payload.target_status)
    db.add(item)
    db.commit()
    return {"status": "ok"}


@router.delete("/{resource_type}/{item_id}")
def delete_item(
    resource_type: str,
    item_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_password_ready_admin)],
    confirm: bool = Query(default=False),
) -> dict[str, str]:
    if not confirm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="永久删除需要 confirm=true")

    model = PUBLISHABLE_MODELS.get(resource_type)
    if model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="资源类型不存在")

    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="内容不存在")

    db.delete(item)
    db.commit()
    return {"status": "ok"}
