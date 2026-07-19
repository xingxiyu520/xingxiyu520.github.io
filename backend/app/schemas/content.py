from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

ContentStatus = Literal["draft", "published", "offline", "archived"]
TaxonomyType = Literal["article", "share", "project"]


class CategoryOut(BaseModel):
    id: str
    name: str
    type: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class TagOut(BaseModel):
    id: str
    name: str
    type: str

    model_config = ConfigDict(from_attributes=True)


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    type: TaxonomyType
    sort_order: int = 0


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    type: TaxonomyType


class ArticleBase(BaseModel):
    slug: str | None = Field(default=None, max_length=160)
    title: str = Field(min_length=1, max_length=220)
    summary: str | None = None
    content_markdown: str = ""
    cover_url: str | None = Field(default=None, max_length=500)
    category_id: str | None = None
    category_name: str | None = Field(default="默认", max_length=80)
    tag_ids: list[str] = Field(default_factory=list)
    tag_names: list[str] = Field(default_factory=list)
    status: ContentStatus = "draft"
    is_pinned: bool = False
    sort_order: int = 0
    published_at: datetime | None = None


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    slug: str | None = Field(default=None, max_length=160)
    title: str | None = Field(default=None, min_length=1, max_length=220)
    summary: str | None = None
    content_markdown: str | None = None
    cover_url: str | None = Field(default=None, max_length=500)
    category_id: str | None = None
    category_name: str | None = Field(default=None, max_length=80)
    tag_ids: list[str] | None = None
    tag_names: list[str] | None = None
    status: ContentStatus | None = None
    is_pinned: bool | None = None
    sort_order: int | None = None
    published_at: datetime | None = None


class ArticleOut(BaseModel):
    id: str
    slug: str
    title: str
    summary: str | None
    content_markdown: str | None = None
    cover_url: str | None
    category: CategoryOut
    tags: list[TagOut]
    status: str
    view_count: int
    like_count: int
    is_pinned: bool
    sort_order: int
    published_at: datetime | None
    archived_at: datetime | None
    created_at: datetime
    updated_at: datetime


class LikeOut(BaseModel):
    target_type: Literal["site", "article"]
    target_id: str
    count: int
    liked: bool


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    slug: str | None = Field(default=None, max_length=160)
    description: str | None = None
    cover_url: str | None = Field(default=None, max_length=500)
    tech_stack: list[str] = Field(default_factory=list)
    github_url: str | None = Field(default=None, max_length=500)
    demo_url: str | None = Field(default=None, max_length=500)
    status: ContentStatus = "draft"
    sort_order: int = 0


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    slug: str | None = Field(default=None, max_length=160)
    description: str | None = None
    cover_url: str | None = Field(default=None, max_length=500)
    tech_stack: list[str] | None = None
    github_url: str | None = Field(default=None, max_length=500)
    demo_url: str | None = Field(default=None, max_length=500)
    status: ContentStatus | None = None
    sort_order: int | None = None


class ProjectOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    cover_url: str | None
    tech_stack: list[str]
    github_url: str | None
    demo_url: str | None
    status: str
    sort_order: int
    archived_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FriendLinkCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    url: str = Field(min_length=1, max_length=500)
    avatar_url: str | None = Field(default=None, max_length=500)
    description: str | None = None
    is_visible: bool = True
    status: ContentStatus = "published"
    sort_order: int = 0


class FriendLinkUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    url: str | None = Field(default=None, min_length=1, max_length=500)
    avatar_url: str | None = Field(default=None, max_length=500)
    description: str | None = None
    is_visible: bool | None = None
    status: ContentStatus | None = None
    sort_order: int | None = None


class FriendLinkOut(BaseModel):
    id: str
    name: str
    url: str
    avatar_url: str | None
    description: str | None
    is_visible: bool
    status: str
    sort_order: int
    archived_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShareCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    type: str = Field(min_length=1, max_length=40)
    external_url: str = Field(min_length=1, max_length=500)
    description: str | None = None
    cover_url: str | None = Field(default=None, max_length=500)
    category_id: str | None = None
    category_name: str | None = Field(default="默认", max_length=80)
    tag_ids: list[str] = Field(default_factory=list)
    tag_names: list[str] = Field(default_factory=list)
    status: ContentStatus = "draft"
    sort_order: int = 0
    published_at: datetime | None = None


class ShareUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    type: str | None = Field(default=None, min_length=1, max_length=40)
    external_url: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    cover_url: str | None = Field(default=None, max_length=500)
    category_id: str | None = None
    category_name: str | None = Field(default=None, max_length=80)
    tag_ids: list[str] | None = None
    tag_names: list[str] | None = None
    status: ContentStatus | None = None
    sort_order: int | None = None
    published_at: datetime | None = None


class ShareOut(BaseModel):
    id: str
    title: str
    type: str
    external_url: str
    description: str | None
    cover_url: str | None
    category: CategoryOut
    tags: list[TagOut]
    status: str
    sort_order: int
    published_at: datetime | None
    archived_at: datetime | None
    created_at: datetime
    updated_at: datetime


class RestoreRequest(BaseModel):
    target_status: Literal["draft", "published", "offline"] = "draft"


class DashboardOut(BaseModel):
    article_count: int
    project_count: int
    friend_link_count: int
    share_count: int
    total_view_count: int
    draft_count: int
    published_count: int
    recent_updates: list[dict[str, Any]]
