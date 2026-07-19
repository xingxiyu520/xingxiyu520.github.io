import { apiRequest } from './client';

export type ApiCategory = {
  id: string;
  name: string;
  type: string;
  sort_order: number;
};

export type ApiTag = {
  id: string;
  name: string;
  type: string;
};

export type ApiArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content_markdown?: string | null;
  cover_url: string | null;
  category: ApiCategory;
  tags: ApiTag[];
  status: string;
  view_count: number;
  like_count: number;
  is_pinned: boolean;
  sort_order: number;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiProject = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  tech_stack: string[];
  github_url: string | null;
  demo_url: string | null;
  status: string;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiShare = {
  id: string;
  title: string;
  type: string;
  external_url: string;
  description: string | null;
  cover_url: string | null;
  category: ApiCategory;
  tags: ApiTag[];
  status: string;
  sort_order: number;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiFriendLink = {
  id: string;
  name: string;
  url: string;
  avatar_url: string | null;
  description: string | null;
  is_visible: boolean;
  status: string;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiSiteConfig = {
  configs: Record<string, unknown>;
};

export type PublicContentResponse = {
  articles: ApiArticle[];
  projects: ApiProject[];
  shares: ApiShare[];
  friendLinks: ApiFriendLink[];
  siteConfig: Record<string, unknown>;
  available: {
    articles: boolean;
    projects: boolean;
    shares: boolean;
    friendLinks: boolean;
    siteConfig: boolean;
  };
};

export type PublicSearchResponse = {
  articles: ApiArticle[];
  shares: ApiShare[];
};

export type ApiLikeStatus = {
  target_type: 'site' | 'article';
  target_id: string;
  count: number;
  liked: boolean;
};

function likeHeaders(clientId: string): HeadersInit {
  return {
    'X-Like-Client-Id': clientId,
  };
}

export async function fetchPublicContent(signal?: AbortSignal): Promise<PublicContentResponse> {
  const [articles, projects, shares, friendLinks, siteConfig] = await Promise.allSettled([
    apiRequest<ApiArticle[]>('/articles', { signal }),
    apiRequest<ApiProject[]>('/projects', { signal }),
    apiRequest<ApiShare[]>('/shares', { signal }),
    apiRequest<ApiFriendLink[]>('/friend-links', { signal }),
    apiRequest<ApiSiteConfig>('/site-config', { signal }),
  ]);

  return {
    articles: articles.status === 'fulfilled' ? articles.value : [],
    projects: projects.status === 'fulfilled' ? projects.value : [],
    shares: shares.status === 'fulfilled' ? shares.value : [],
    friendLinks: friendLinks.status === 'fulfilled' ? friendLinks.value : [],
    siteConfig: siteConfig.status === 'fulfilled' ? siteConfig.value.configs : {},
    available: {
      articles: articles.status === 'fulfilled',
      projects: projects.status === 'fulfilled',
      shares: shares.status === 'fulfilled',
      friendLinks: friendLinks.status === 'fulfilled',
      siteConfig: siteConfig.status === 'fulfilled',
    },
  };
}

export async function fetchArticleDetail(slug: string, signal?: AbortSignal): Promise<ApiArticle | null> {
  try {
    return await apiRequest<ApiArticle>(`/articles/${encodeURIComponent(slug)}`, { signal });
  } catch {
    return null;
  }
}

export function fetchSiteLikeStatus(clientId: string, signal?: AbortSignal): Promise<ApiLikeStatus> {
  return apiRequest<ApiLikeStatus>('/site/like', {
    signal,
    headers: likeHeaders(clientId),
  });
}

export function setSiteLikeStatus(clientId: string, liked: boolean): Promise<ApiLikeStatus> {
  return apiRequest<ApiLikeStatus>('/site/like', {
    method: liked ? 'POST' : 'DELETE',
    headers: likeHeaders(clientId),
  });
}

export function fetchArticleLikeStatus(slug: string, clientId: string, signal?: AbortSignal): Promise<ApiLikeStatus> {
  return apiRequest<ApiLikeStatus>(`/articles/${encodeURIComponent(slug)}/like`, {
    signal,
    headers: likeHeaders(clientId),
  });
}

export function setArticleLikeStatus(slug: string, clientId: string, liked: boolean): Promise<ApiLikeStatus> {
  return apiRequest<ApiLikeStatus>(`/articles/${encodeURIComponent(slug)}/like`, {
    method: liked ? 'POST' : 'DELETE',
    headers: likeHeaders(clientId),
  });
}

export async function searchPublicContent(query: string, signal?: AbortSignal): Promise<PublicSearchResponse | null> {
  try {
    return await apiRequest<PublicSearchResponse>(`/search?q=${encodeURIComponent(query)}`, { signal });
  } catch {
    return null;
  }
}
