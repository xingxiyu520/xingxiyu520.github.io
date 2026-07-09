import { apiRequest } from './client';
import type { ApiArticle, ApiFriendLink, ApiProject, ApiShare } from './content';

export type ContentStatus = 'draft' | 'published' | 'offline' | 'archived';

export type DashboardData = {
  article_count: number;
  project_count: number;
  friend_link_count: number;
  share_count: number;
  total_view_count: number;
  draft_count: number;
  published_count: number;
  recent_updates: Array<{
    type: string;
    id: string;
    title: string;
    status: string;
    updated_at: string;
  }>;
};

export type ArticlePayload = {
  title: string;
  slug?: string;
  summary?: string;
  content_markdown: string;
  cover_url?: string;
  category_name?: string;
  tag_names?: string[];
  status: ContentStatus;
  is_pinned?: boolean;
  sort_order?: number;
};

export type ProjectPayload = {
  name: string;
  slug?: string;
  description?: string;
  cover_url?: string;
  tech_stack: string[];
  github_url?: string;
  demo_url?: string;
  status: ContentStatus;
  sort_order?: number;
};

export type FriendLinkPayload = {
  name: string;
  url: string;
  avatar_url?: string;
  description?: string;
  is_visible: boolean;
  status: ContentStatus;
  sort_order?: number;
};

export type SharePayload = {
  title: string;
  type: string;
  external_url: string;
  description?: string;
  cover_url?: string;
  category_name?: string;
  tag_names?: string[];
  status: ContentStatus;
  sort_order?: number;
};

export type UploadedFile = {
  id: string;
  original_name: string;
  stored_name: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  owner_type: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteConfigResponse = {
  configs: Record<string, unknown>;
};

export function getDashboard() {
  return apiRequest<DashboardData>('/admin/dashboard', { auth: true });
}

export function listAdminArticles() {
  return apiRequest<ApiArticle[]>('/admin/articles', { auth: true });
}

export function createArticle(payload: ArticlePayload) {
  return apiRequest<ApiArticle>('/admin/articles', { method: 'POST', auth: true, body: payload });
}

export function updateArticle(id: string, payload: Partial<ArticlePayload>) {
  return apiRequest<ApiArticle>(`/admin/articles/${id}`, { method: 'PUT', auth: true, body: payload });
}

export function importMarkdownArticle(file: File, categoryName: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category_name', categoryName);
  return apiRequest<ApiArticle>('/admin/articles/import-md', { method: 'POST', auth: true, body: formData });
}

export function listAdminProjects() {
  return apiRequest<ApiProject[]>('/admin/projects', { auth: true });
}

export function createProject(payload: ProjectPayload) {
  return apiRequest<ApiProject>('/admin/projects', { method: 'POST', auth: true, body: payload });
}

export function updateProject(id: string, payload: Partial<ProjectPayload>) {
  return apiRequest<ApiProject>(`/admin/projects/${id}`, { method: 'PUT', auth: true, body: payload });
}

export function listAdminFriendLinks() {
  return apiRequest<ApiFriendLink[]>('/admin/friend-links', { auth: true });
}

export function createFriendLink(payload: FriendLinkPayload) {
  return apiRequest<ApiFriendLink>('/admin/friend-links', { method: 'POST', auth: true, body: payload });
}

export function updateFriendLink(id: string, payload: Partial<FriendLinkPayload>) {
  return apiRequest<ApiFriendLink>(`/admin/friend-links/${id}`, { method: 'PUT', auth: true, body: payload });
}

export function listAdminShares() {
  return apiRequest<ApiShare[]>('/admin/shares', { auth: true });
}

export function createShare(payload: SharePayload) {
  return apiRequest<ApiShare>('/admin/shares', { method: 'POST', auth: true, body: payload });
}

export function updateShare(id: string, payload: Partial<SharePayload>) {
  return apiRequest<ApiShare>(`/admin/shares/${id}`, { method: 'PUT', auth: true, body: payload });
}

export function archiveItem(resourceType: string, id: string) {
  return apiRequest<{ status: string }>(`/admin/${resourceType}/${id}/archive`, { method: 'POST', auth: true });
}

export function restoreItem(resourceType: string, id: string, targetStatus: Exclude<ContentStatus, 'archived'> = 'draft') {
  return apiRequest<{ status: string }>(`/admin/${resourceType}/${id}/restore`, {
    method: 'POST',
    auth: true,
    body: { target_status: targetStatus },
  });
}

export function deleteItem(resourceType: string, id: string) {
  return apiRequest<{ status: string }>(`/admin/${resourceType}/${id}?confirm=true`, {
    method: 'DELETE',
    auth: true,
  });
}

export function getSiteConfig() {
  return apiRequest<SiteConfigResponse>('/admin/site-config', { auth: true });
}

export function updateSiteConfig(configs: Record<string, unknown>) {
  return apiRequest<SiteConfigResponse>('/admin/site-config', {
    method: 'PUT',
    auth: true,
    body: { configs },
  });
}

export function uploadAdminImage(file: File, ownerType?: string, ownerId?: string, articleSlug?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (ownerType) formData.append('owner_type', ownerType);
  if (ownerId) formData.append('owner_id', ownerId);
  if (articleSlug) formData.append('article_slug', articleSlug);
  return apiRequest<UploadedFile>('/admin/upload', { method: 'POST', auth: true, body: formData });
}
