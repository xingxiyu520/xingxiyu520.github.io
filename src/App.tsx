import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './App.css';
import {
  fetchArticleLikeStatus,
  fetchArticleDetail,
  fetchPublicContent,
  fetchSiteLikeStatus,
  recordOutboundClick,
  recordPageView,
  searchPublicContent,
  setArticleLikeStatus,
  setSiteLikeStatus,
  type ApiArticle,
  type ApiFriendLink,
  type ApiProject,
  type ApiShare,
} from './api/content';
import { notesMetadata, type NoteMetadata } from './data/notes';
import { portfolioConfig } from './data/config';
import {
  aboutContent,
  archiveGroups,
  articleDetailContent,
  avatarContent,
  filterItems,
  friendLinks,
  homeContent,
  homeGalleryPhotos,
  homeMenuItems,
  homeRecommendations,
  homeTracks,
  pageItems,
  pageHeroes,
  resources,
  socialLinks,
  uiLabels,
} from './data/siteContent';
import AdminApp from './admin/AdminApp';

type PageKey = 'home' | 'blog' | 'projects' | 'project' | 'about' | 'share' | 'bloggers' | 'article' | 'avatar';

type IconName =
  | 'home'
  | 'book'
  | 'folder'
  | 'heart'
  | 'mail'
  | 'github'
  | 'bilibili'
  | 'xiaohongshu'
  | 'play'
  | 'pause'
  | 'skipBack'
  | 'skipForward'
  | 'close'
  | 'chevronLeft'
  | 'chevronRight'
  | 'spark'
  | 'clock'
  | 'calendar'
  | 'tag'
  | 'link'
  | 'eye'
  | 'bookmark'
  | 'user'
  | 'external'
  | 'code'
  | 'list'
  | 'pen'
  | 'star'
  | 'image';

const iconPaths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M3.5 11.2 12 4l8.5 7.2" />
      <path d="M6.5 10.6V20h11v-9.4" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.2A3.2 3.2 0 0 1 8.2 2H19v17H8.2A3.2 3.2 0 0 0 5 22Z" />
      <path d="M5 5.2V22" />
      <path d="M9 6h6" />
      <path d="M9 10h5" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5Z" />
      <path d="M3 10h18" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.5-8.8-9.2C2.4 7.7 4.2 5 7.1 5c1.7 0 3.1 1 3.9 2.2C11.8 6 13.2 5 14.9 5c2.9 0 4.7 2.7 3.9 5.8C19.5 15.5 12 20 12 20Z" />
  ),
  mail: (
    <>
      <path d="M4.5 6.5h15v11h-15z" />
      <path d="m5 7 7 6 7-6" />
    </>
  ),
  github: (
    <>
      <path d="M9 19.2c-4 .9-4-2-5.6-2.4" />
      <path d="M15 22v-3.1c0-.9.1-1.5-.5-2 2.8-.3 5.8-1.4 5.8-6.2a4.9 4.9 0 0 0-1.3-3.4 4.5 4.5 0 0 0-.1-3.4s-1.1-.3-3.5 1.3a12.1 12.1 0 0 0-6.4 0C6.6 3.6 5.5 3.9 5.5 3.9a4.5 4.5 0 0 0-.1 3.4 4.9 4.9 0 0 0-1.3 3.4c0 4.8 3 5.9 5.8 6.2-.4.4-.6.9-.6 1.7V22" />
    </>
  ),
  bilibili: (
    <>
      <path d="M7.5 6 5 3.7" />
      <path d="M16.5 6 19 3.7" />
      <rect x="4" y="6.5" width="16" height="12" rx="3" />
      <path d="M9 12v1.5" />
      <path d="M15 12v1.5" />
      <path d="M10 16h4" />
    </>
  ),
  xiaohongshu: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="4" />
      <path d="M9 8h6" />
      <path d="M8.5 12h7" />
      <path d="M10 16h4" />
    </>
  ),
  play: (
    <path d="M9 6.8v10.4c0 .8.9 1.3 1.6.8l7.4-5.2c.6-.4.6-1.3 0-1.7L10.6 6c-.7-.5-1.6 0-1.6.8Z" />
  ),
  pause: (
    <>
      <path d="M8 6.5v11" />
      <path d="M16 6.5v11" />
    </>
  ),
  skipBack: (
    <>
      <path d="M6 6v12" />
      <path d="m18 6-9 6 9 6Z" />
    </>
  ),
  skipForward: (
    <>
      <path d="M18 6v12" />
      <path d="m6 6 9 6-9 6Z" />
    </>
  ),
  close: (
    <>
      <path d="M6.5 6.5 17.5 17.5" />
      <path d="m17.5 6.5-11 11" />
    </>
  ),
  chevronLeft: (
    <path d="m15 6-6 6 6 6" />
  ),
  chevronRight: (
    <path d="m9 6 6 6-6 6" />
  ),
  spark: (
    <>
      <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18l-1.8-5.4-5.7-1.8L10.2 9Z" />
      <path d="m18 16 1 2.4 2.5.8-2.5.8-1 2.5-1-2.5-2.5-.8 2.5-.8Z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.2 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="3" />
      <path d="M8 3.5v4" />
      <path d="M16 3.5v4" />
      <path d="M4 10h16" />
    </>
  ),
  tag: (
    <>
      <path d="M4.5 5.8V12l6.9 6.9a2.2 2.2 0 0 0 3.1 0l4.4-4.4a2.2 2.2 0 0 0 0-3.1L12 4.5H5.8a1.3 1.3 0 0 0-1.3 1.3Z" />
      <path d="M8.5 8.5h.1" />
    </>
  ),
  link: (
    <>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M10.5 7.2 12 5.7a4 4 0 1 1 5.7 5.7l-1.5 1.5" />
      <path d="M13.5 16.8 12 18.3a4 4 0 1 1-5.7-5.7l1.5-1.5" />
    </>
  ),
  eye: (
    <>
      <path d="M3.5 12s3.2-5.5 8.5-5.5 8.5 5.5 8.5 5.5-3.2 5.5-8.5 5.5S3.5 12 3.5 12Z" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
  bookmark: (
    <path d="M7 4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5V20l-5-3.2L7 20Z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  external: (
    <>
      <path d="M14 5h5v5" />
      <path d="M13 11 19 5" />
      <path d="M10 6H6.5A2.5 2.5 0 0 0 4 8.5v9A2.5 2.5 0 0 0 6.5 20h9A2.5 2.5 0 0 0 18 17.5V14" />
    </>
  ),
  code: (
    <>
      <path d="m8 9-4 3 4 3" />
      <path d="m16 9 4 3-4 3" />
      <path d="m13.5 6-3 12" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <path d="M4 6h.1" />
      <path d="M4 12h.1" />
      <path d="M4 18h.1" />
    </>
  ),
  pen: (
    <>
      <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10Z" />
      <path d="m14 7 3 3" />
    </>
  ),
  star: (
    <path d="m12 3.8 2.4 5 5.4.8-3.9 3.8.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.9-3.8 5.4-.8Z" />
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m6.5 17 4-4 3 3 2-2 2.5 3" />
    </>
  ),
};

type SocialLinkItem = { label: string; href: string; icon: IconName };

type ProjectCard = {
  id?: string;
  slug: string;
  name: string;
  year: string;
  desc: string;
  contentMarkdown?: string | null;
  tags: string[];
  icon: string;
  website: string;
  github: string;
};

type ResourceCard = {
  id?: string;
  title: string;
  url: string;
  href: string;
  category: string;
  desc: string;
  views: string;
  marks: string;
  icon: IconName;
};

type FriendCard = {
  name: string;
  url: string;
  href: string;
  desc: string;
  tone: 'pink' | 'blue';
  avatarUrl?: string;
};

type ArchivePost = {
  date: string;
  title: string;
  tags: string[];
};

type ArchiveGroup = {
  year: string;
  count: number;
  posts: ArchivePost[];
};

type HomeTrack = {
  title: string;
  artist: string;
  src: string;
  duration: number;
};

type GalleryPhoto = {
  title: string;
  caption: string;
  src: string;
  alt: string;
};

type RuntimeSite = {
  profileName: string;
  headingAccent: string;
  avatarUrl: string;
  email: string;
  github: string;
  homeStatus: string;
  musicTracks: readonly HomeTrack[];
  galleryPhotos: readonly GalleryPhoto[];
};

type FrontendContent = {
  notes: NoteMetadata[];
  archiveGroups: ArchiveGroup[];
  projects: ProjectCard[];
  resources: ResourceCard[];
  friendLinks: FriendCard[];
  site: RuntimeSite;
  isLoading: boolean;
  isFallback: boolean;
  errorMessage?: string;
};

type DisplayNote = NoteMetadata & {
  contentMarkdown?: string | null;
  coverUrl?: string | null;
  viewCount?: number;
  likeCount?: number;
};

const fallbackProjects: ProjectCard[] = portfolioConfig.projects.map((project, index) => ({
  slug: project.name.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  name: project.name.zh.replace(/^[^\u4e00-\u9fa5A-Za-z]+/, ''),
  year: ['2026', '2025', '2024'][index] ?? '2024',
  desc: project.desc.zh,
  contentMarkdown: '',
  tags: [...project.tags],
  icon: project.icon,
  website: project.website,
  github: project.github,
}));

const fallbackResources: ResourceCard[] = resources.map((resource) => ({
  ...resource,
  icon: resource.icon as IconName,
}));

const fallbackFriendLinks: FriendCard[] = friendLinks.map((friend) => ({
  name: friend.name,
  url: friend.url,
  href: friend.url.startsWith('http') ? friend.url : `https://${friend.url}`,
  desc: friend.desc,
  tone: friend.tone as 'pink' | 'blue',
  avatarUrl: undefined,
}));

const fallbackSite: RuntimeSite = {
  profileName: portfolioConfig.profile.name,
  headingAccent: portfolioConfig.hero.headingAccent,
  avatarUrl: portfolioConfig.profile.avatarUrl,
  email: portfolioConfig.contact.email,
  github: portfolioConfig.contact.github,
  homeStatus: homeContent.site.status,
  musicTracks: homeTracks,
  galleryPhotos: homeGalleryPhotos,
};

const fallbackContent: FrontendContent = {
  notes: notesMetadata,
  archiveGroups: archiveGroups.map((group) => ({
    year: group.year,
    count: group.count,
    posts: group.posts.map((post) => ({
      date: post.date,
      title: post.title,
      tags: [...post.tags],
    })),
  })),
  projects: fallbackProjects,
  resources: fallbackResources,
  friendLinks: fallbackFriendLinks,
  site: fallbackSite,
  isLoading: false,
  isFallback: true,
};

function createSocials(github: string): SocialLinkItem[] {
  return socialLinks.map((social) => ({
    ...social,
    href: social.href === 'github' ? github : social.href,
  }));
}

function readConfigString(configs: Record<string, unknown>, path: string[], flatKey: string, fallback: string): string {
  const flatValue = configs[flatKey];
  if (typeof flatValue === 'string' && flatValue.trim()) {
    return flatValue;
  }

  let current: unknown = configs;
  for (const key of path) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return fallback;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'string' && current.trim() ? current : fallback;
}

function readConfigArray<T>(
  configs: Record<string, unknown>,
  flatKey: string,
  fallback: readonly T[],
  normalize: (item: unknown) => T | null,
): readonly T[] {
  const value = configs[flatKey];
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value.map(normalize).filter((item): item is T => item !== null);
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeTrack(item: unknown): HomeTrack | null {
  if (!item || typeof item !== 'object') return null;
  const source = item as Record<string, unknown>;
  const title = typeof source.title === 'string' ? source.title : '';
  const artist = typeof source.artist === 'string' ? source.artist : '';
  const src = typeof source.src === 'string' ? source.src : '';
  const duration = typeof source.duration === 'number' ? source.duration : 180;
  if (!title.trim()) return null;
  return { title, artist: artist || '未知歌手', src, duration };
}

function normalizeGalleryPhoto(item: unknown): GalleryPhoto | null {
  if (!item || typeof item !== 'object') return null;
  const source = item as Record<string, unknown>;
  const title = typeof source.title === 'string' ? source.title : '';
  const src = typeof source.src === 'string' ? source.src : '';
  if (!title.trim() || !src.trim()) return null;
  return {
    title,
    caption: typeof source.caption === 'string' ? source.caption : title,
    src,
    alt: typeof source.alt === 'string' ? source.alt : title,
  };
}

function buildRuntimeSite(configs: Record<string, unknown>): RuntimeSite {
  return {
    profileName: readConfigString(configs, ['profile', 'name'], 'profile.name', fallbackSite.profileName),
    headingAccent: readConfigString(configs, ['hero', 'headingAccent'], 'hero.headingAccent', fallbackSite.headingAccent),
    avatarUrl: readConfigString(configs, ['profile', 'avatarUrl'], 'profile.avatarUrl', fallbackSite.avatarUrl),
    email: readConfigString(configs, ['contact', 'email'], 'contact.email', fallbackSite.email),
    github: readConfigString(configs, ['contact', 'github'], 'contact.github', fallbackSite.github),
    homeStatus: readConfigString(configs, ['home', 'status'], 'home.status', fallbackSite.homeStatus),
    musicTracks: readConfigArray(configs, 'home.musicTracks', fallbackSite.musicTracks, normalizeTrack),
    galleryPhotos: readConfigArray(configs, 'home.galleryPhotos', fallbackSite.galleryPhotos, normalizeGalleryPhoto),
  };
}

function getDateString(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value.slice(0, 10);
}

function apiArticleToNote(article: ApiArticle): DisplayNote {
  const date = getDateString(article.published_at ?? article.created_at, article.created_at.slice(0, 10));

  return {
    slug: article.slug,
    title: {
      zh: article.title,
      en: article.title,
    },
    summary: {
      zh: article.summary ?? article.title,
      en: article.summary ?? article.title,
    },
    date,
    tags: article.tags.map((tag) => tag.name),
    contentMarkdown: article.content_markdown ?? null,
    coverUrl: article.cover_url,
    viewCount: article.view_count,
    likeCount: article.like_count,
  };
}

function buildArchiveGroups(notes: readonly DisplayNote[]): ArchiveGroup[] {
  const grouped = notes.reduce<Record<string, ArchivePost[]>>((acc, note) => {
    const year = note.date.slice(0, 4) || '未归档';
    const month = note.date.slice(5, 7) || '01';
    const day = note.date.slice(8, 10) || '01';

    acc[year] = acc[year] ?? [];
    acc[year].push({
      date: `${month}.${day}`,
      title: note.title.zh,
      tags: note.tags,
    });

    return acc;
  }, {});

  return Object.entries(grouped)
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([year, posts]) => ({
      year,
      count: posts.length,
      posts,
    }));
}

function apiProjectToCard(project: ApiProject, index: number): ProjectCard {
  const year = getDateString(project.created_at, new Date().getFullYear().toString()).slice(0, 4);
  const nameParts = project.name.match(/[A-Za-z0-9\u4e00-\u9fa5]/g) ?? ['P', String(index + 1)];

  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    year,
    desc: project.description ?? project.name,
    contentMarkdown: project.content_markdown,
    tags: project.tech_stack,
    icon: nameParts.slice(0, 2).join('').toUpperCase(),
    website: project.demo_url ?? project.github_url ?? '#',
    github: project.github_url ?? project.demo_url ?? '#',
  };
}

function displayUrl(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function iconForShare(share: ApiShare): IconName {
  const source = `${share.type} ${share.category.name}`.toLowerCase();
  if (source.includes('ai') || source.includes('人工智能')) return 'spark';
  if (source.includes('tool') || source.includes('工具')) return 'code';
  if (source.includes('read') || source.includes('阅读') || source.includes('文章')) return 'book';
  return 'external';
}

function apiShareToResource(share: ApiShare): ResourceCard {
  return {
    id: share.id,
    title: share.title,
    url: displayUrl(share.external_url),
    href: share.external_url,
    category: share.category.name || share.type,
    desc: share.description ?? share.title,
    views: '外部链接',
    marks: share.tags[0]?.name ?? share.type,
    icon: iconForShare(share),
  };
}

function apiFriendToCard(friend: ApiFriendLink, index: number): FriendCard {
  return {
    name: friend.name,
    url: displayUrl(friend.url),
    href: friend.url,
    desc: friend.description ?? friend.url,
    tone: index % 2 === 0 ? 'pink' : 'blue',
    avatarUrl: friend.avatar_url ?? undefined,
  };
}

function buildFrontendContent(
  apiContent: Awaited<ReturnType<typeof fetchPublicContent>>,
): FrontendContent {
  const { articles: apiArticles, projects: apiProjects, shares: apiShares, friendLinks: apiFriendLinks, siteConfig, available } = apiContent;
  const notes = apiArticles.length > 0 ? apiArticles.map(apiArticleToNote) : fallbackContent.notes;
  const projects = available.projects ? apiProjects.map(apiProjectToCard) : fallbackContent.projects;
  const apiResources = available.shares ? apiShares.map(apiShareToResource) : fallbackContent.resources;
  const apiFriends = available.friendLinks ? apiFriendLinks.map(apiFriendToCard) : fallbackContent.friendLinks;
  const hasApiConnection = available.articles || available.projects || available.shares || available.friendLinks || available.siteConfig;

  return {
    notes: available.articles ? apiArticles.map(apiArticleToNote) : notes,
    archiveGroups: available.articles ? buildArchiveGroups(apiArticles.map(apiArticleToNote)) : fallbackContent.archiveGroups,
    projects,
    resources: apiResources,
    friendLinks: apiFriends,
    site: buildRuntimeSite(siteConfig),
    isLoading: false,
    isFallback: !hasApiConnection,
    errorMessage: hasApiConnection ? undefined : '本地内容',
  };
}

function useFrontendContent(): FrontendContent {
  const [content, setContent] = useState<FrontendContent>({ ...fallbackContent, isLoading: true });

  useEffect(() => {
    const controller = new AbortController();

    fetchPublicContent(controller.signal)
      .then((apiContent) => {
        if (!controller.signal.aborted) {
          setContent(buildFrontendContent(apiContent));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setContent({ ...fallbackContent, isLoading: false, isFallback: true, errorMessage: '本地内容' });
        }
      });

    return () => controller.abort();
  }, []);

  return content;
}

function renderMarkdownLite(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const elements: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    elements.push(
      <ul key={`list-${elements.length}`}>
        {listItems.map((item) => <li key={item}>{item}</li>)}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2));
      return;
    }

    flushList();

    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={`h2-${index}`}>{trimmed.slice(3)}</h2>);
      return;
    }

    if (trimmed.startsWith('# ')) {
      return;
    }

    elements.push(<p key={`p-${index}`}>{trimmed}</p>);
  });

  flushList();
  return elements;
}

type LikeState = {
  count: number;
  liked: boolean;
};

const SITE_LIKE_STORAGE_KEY = 'xiyu-feather:site-like';
const ARTICLE_LIKE_STORAGE_PREFIX = 'xiyu-feather:article-like:';
const LIKE_CLIENT_ID_STORAGE_KEY = 'xiyu-feather:like-client-id';
const SITE_LIKE_BASE_COUNT = 12508;
const ARTICLE_LIKE_BASE_COUNT = 128;

function getArticleLikeStorageKey(slug: string) {
  return `${ARTICLE_LIKE_STORAGE_PREFIX}${encodeURIComponent(slug)}`;
}

function createLikeClientId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getLikeClientId() {
  try {
    const stored = window.localStorage.getItem(LIKE_CLIENT_ID_STORAGE_KEY);
    if (stored) {
      return stored;
    }

    const next = createLikeClientId();
    window.localStorage.setItem(LIKE_CLIENT_ID_STORAGE_KEY, next);
    return next;
  } catch {
    return createLikeClientId();
  }
}

function readLikeState(storageKey: string, baseCount: number): LikeState {
  try {
    const stored = window.localStorage.getItem(storageKey);

    if (!stored) {
      return { count: baseCount, liked: false };
    }

    const parsed = JSON.parse(stored) as Partial<LikeState>;

    return {
      count: typeof parsed.count === 'number' ? parsed.count : baseCount,
      liked: parsed.liked === true,
    };
  } catch {
    return { count: baseCount, liked: false };
  }
}

function writeLikeState(storageKey: string, state: LikeState) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in strict privacy modes. Keep the in-memory state working.
  }
}

function toggleLike(current: LikeState) {
  return {
    liked: !current.liked,
    count: Math.max(0, current.count + (current.liked ? -1 : 1)),
  };
}

function formatLikeCount(count: number) {
  return count.toLocaleString('en-US');
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('Copy command failed');
  }
}

const Icon = ({ name, className }: { name: IconName; className?: string }) => (
  <svg className={className ?? 'line-icon'} viewBox="0 0 24 24" aria-hidden="true">
    {iconPaths[name]}
  </svg>
);

const digitSegments: Record<string, Array<'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'>> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'd', 'e', 'g'],
  '3': ['a', 'b', 'c', 'd', 'g'],
  '4': ['b', 'c', 'f', 'g'],
  '5': ['a', 'c', 'd', 'f', 'g'],
  '6': ['a', 'c', 'd', 'e', 'f', 'g'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
};

function SevenSegmentDigit({ value }: { value: string }) {
  const activeSegments = digitSegments[value] ?? [];
  return (
    <span className="seg-digit" aria-hidden="true">
      {(['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const).map((segment) => (
        <span className={activeSegments.includes(segment) ? `seg seg-${segment} active` : `seg seg-${segment}`} key={segment} />
      ))}
    </span>
  );
}

function SevenSegmentTime({ value }: { value: string }) {
  return (
    <span className="seg-time" aria-hidden="true">
      {[...value].map((char, index) => (
        char === ':' ? (
          <span className="seg-colon" key={`${char}-${index}`}>
            <span />
            <span />
          </span>
        ) : (
          <SevenSegmentDigit value={char} key={`${char}-${index}`} />
        )
      ))}
    </span>
  );
}

const synthMelodies = [
  [392, 440, 494, 587, 494, 440, 392, 330],
  [349, 392, 523, 587, 523, 392, 349, 294],
  [440, 494, 554, 659, 554, 494, 440, 370],
] as const;

function formatPlayerTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = String(Math.floor(safeSeconds % 60)).padStart(2, '0');

  return `${minutes}:${remainingSeconds}`;
}

function MusicPlayer({ tracks }: { tracks: readonly HomeTrack[] }) {
  const safeTracks = tracks.length > 0 ? tracks : homeTracks;
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);
  const synthIntervalRef = useRef<number | undefined>(undefined);
  const synthFrameRef = useRef<number | undefined>(undefined);
  const synthStartedAtRef = useRef(0);
  const currentTimeRef = useRef(0);
  const trackIndexRef = useRef(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(safeTracks[0].duration);
  const [playerMessage, setPlayerMessage] = useState('');
  const currentTrack = safeTracks[trackIndex] ?? safeTracks[0];
  const hasAudioSource = currentTrack.src.trim().length > 0;
  const activeDuration = Math.max(1, hasAudioSource ? duration : currentTrack.duration);
  const progressPercent = Math.min(100, Math.max(0, (currentTime / activeDuration) * 100));

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    trackIndexRef.current = trackIndex;
  }, [trackIndex]);

  const stopSynthPlayback = useCallback(() => {
    if (synthIntervalRef.current !== undefined) {
      window.clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = undefined;
    }

    if (synthFrameRef.current !== undefined) {
      window.cancelAnimationFrame(synthFrameRef.current);
      synthFrameRef.current = undefined;
    }

    const context = audioContextRef.current;
    const gain = synthGainRef.current;

    if (context && gain) {
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setTargetAtTime(0.0001, context.currentTime, 0.04);
    }
  }, []);

  const selectTrack = useCallback((nextIndex: number) => {
    const normalizedIndex = (nextIndex + safeTracks.length) % safeTracks.length;

    setPlayerMessage('');
    setCurrentTime(0);
    currentTimeRef.current = 0;
    trackIndexRef.current = normalizedIndex;
    setDuration(safeTracks[normalizedIndex].duration);
    setTrackIndex(normalizedIndex);
  }, [safeTracks]);

  const changeTrack = useCallback((step: -1 | 1) => {
    selectTrack(trackIndexRef.current + step);
  }, [selectTrack]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.load();
  }, [trackIndex]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !hasAudioSource) {
      return undefined;
    }

    if (!isPlaying) {
      audio.pause();
      return undefined;
    }

    audio.volume = 0.72;
    audio.play().catch(() => {
      setIsPlaying(false);
      setPlayerMessage(uiLabels.musicUnavailable);
    });

    return undefined;
  }, [hasAudioSource, isPlaying, trackIndex]);

  useEffect(() => {
    if (hasAudioSource || !isPlaying) {
      stopSynthPlayback();
      return undefined;
    }

    let cancelled = false;
    let noteIndex = 0;
    const melody = synthMelodies[trackIndex % synthMelodies.length];

    const playSynthNote = async () => {
      try {
        const context = audioContextRef.current ?? new AudioContext();
        audioContextRef.current = context;

        if (context.state === 'suspended') {
          await context.resume();
        }

        if (cancelled) {
          return;
        }

        if (!synthGainRef.current) {
          const masterGain = context.createGain();
          masterGain.connect(context.destination);
          synthGainRef.current = masterGain;
        }

        const masterGain = synthGainRef.current;
        masterGain.gain.cancelScheduledValues(context.currentTime);
        masterGain.gain.setTargetAtTime(0.075, context.currentTime, 0.08);

        const oscillator = context.createOscillator();
        const noteGain = context.createGain();
        const frequency = melody[noteIndex % melody.length];
        noteIndex += 1;

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        noteGain.gain.setValueAtTime(0.0001, context.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.035);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.34);
        oscillator.connect(noteGain);
        noteGain.connect(masterGain);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.36);
      } catch {
        if (!cancelled) {
          setIsPlaying(false);
          setPlayerMessage(uiLabels.musicUnavailable);
        }
      }
    };

    const tickProgress = () => {
      const elapsed = (performance.now() - synthStartedAtRef.current) / 1000;

      if (elapsed >= currentTrack.duration) {
        setCurrentTime(currentTrack.duration);
        changeTrack(1);
        return;
      }

      setCurrentTime(elapsed);
      synthFrameRef.current = window.requestAnimationFrame(tickProgress);
    };

    synthStartedAtRef.current = performance.now() - currentTimeRef.current * 1000;
    void playSynthNote();
    synthIntervalRef.current = window.setInterval(() => {
      void playSynthNote();
    }, 430);
    synthFrameRef.current = window.requestAnimationFrame(tickProgress);

    return () => {
      cancelled = true;
      stopSynthPlayback();
    };
  }, [changeTrack, currentTrack.duration, hasAudioSource, isPlaying, stopSynthPlayback, trackIndex]);

  const handleTogglePlayback = () => {
    setPlayerMessage('');
    setIsPlaying((playing) => !playing);
  };

  const handleSeek = (value: number) => {
    const nextTime = (value / 100) * activeDuration;

    setCurrentTime(nextTime);
    currentTimeRef.current = nextTime;

    if (hasAudioSource && audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }

    if (!hasAudioSource && isPlaying) {
      synthStartedAtRef.current = performance.now() - nextTime * 1000;
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const audioDuration = Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : currentTrack.duration;

    setDuration(audioDuration);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setCurrentTime(audio.currentTime);
  };

  const progressStyle = {
    '--music-progress': `${progressPercent}%`,
  } as CSSProperties;

  return (
    <section className={isPlaying ? 'glass-card music-card is-playing' : 'glass-card music-card'}>
      <audio
        ref={audioRef}
        src={hasAudioSource ? currentTrack.src : undefined}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => changeTrack(1)}
        onError={() => {
          setIsPlaying(false);
          setPlayerMessage(uiLabels.musicUnavailable);
        }}
      />
      <div className="music-main">
        <button
          type="button"
          className="music-play"
          onClick={handleTogglePlayback}
          aria-label={isPlaying ? uiLabels.pauseMusicAria : uiLabels.playMusicAria}
        >
          <Icon name={isPlaying ? 'pause' : 'play'} />
        </button>
        <div className="music-copy">
          <p className="eyebrow">{homeContent.music.eyebrow}</p>
          <h2 title={currentTrack.title}>{currentTrack.title}</h2>
          <span>{currentTrack.artist}</span>
        </div>
      </div>
      <div className="music-toolbar">
        <button type="button" onClick={() => changeTrack(-1)} aria-label={uiLabels.previousTrackAria}>
          <Icon name="skipBack" />
        </button>
        <span>{formatPlayerTime(currentTime)} / {formatPlayerTime(activeDuration)}</span>
        <button type="button" onClick={() => changeTrack(1)} aria-label={uiLabels.nextTrackAria}>
          <Icon name="skipForward" />
        </button>
      </div>
      <input
        className="music-progress"
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={progressPercent}
        onInput={(event) => handleSeek(Number(event.currentTarget.value))}
        onChange={(event) => handleSeek(Number(event.currentTarget.value))}
        aria-label={uiLabels.seekMusicAria}
        style={progressStyle}
      />
      {playerMessage && <p className="music-status">{playerMessage}</p>}
    </section>
  );
}

const PixelAvatar = ({ compact = false }: { compact?: boolean }) => (
  <svg
    className={compact ? 'pixel-avatar compact' : 'pixel-avatar'}
    viewBox="0 0 160 160"
    role="img"
    aria-label={uiLabels.avatarAria}
  >
    <defs>
      <linearGradient id="avatarAura" x1="22" y1="18" x2="138" y2="142" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFD4E4" />
        <stop offset="1" stopColor="#BFE7FF" />
      </linearGradient>
      <filter id="avatarSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#B9DFF8" floodOpacity="0.42" />
      </filter>
    </defs>
    <circle cx="80" cy="80" r="74" fill="url(#avatarAura)" />
    <circle cx="80" cy="80" r="64" fill="rgba(255,255,255,.58)" />
    <g filter="url(#avatarSoftShadow)" shapeRendering="crispEdges">
      <rect x="48" y="44" width="64" height="12" rx="4" fill="#7B8FA8" />
      <rect x="40" y="56" width="80" height="16" rx="4" fill="#91CFF5" />
      <rect x="36" y="72" width="88" height="20" rx="4" fill="#FFE9F2" />
      <rect x="44" y="88" width="72" height="32" rx="8" fill="#FFF8FB" />
      <rect x="56" y="84" width="48" height="44" rx="8" fill="#FFDCE9" />
      <rect x="60" y="76" width="40" height="32" rx="8" fill="#FFF1F6" />
      <rect x="60" y="76" width="40" height="8" fill="#EFAEC4" />
      <rect x="50" y="66" width="14" height="20" fill="#87C8EE" />
      <rect x="96" y="66" width="14" height="20" fill="#87C8EE" />
      <rect x="65" y="88" width="8" height="8" rx="2" fill="#536A82" />
      <rect x="87" y="88" width="8" height="8" rx="2" fill="#536A82" />
      <rect x="68" y="103" width="8" height="4" rx="2" fill="#F4A8BF" />
      <rect x="84" y="103" width="8" height="4" rx="2" fill="#F4A8BF" />
      <rect x="76" y="101" width="8" height="4" rx="2" fill="#6B7D95" />
      <rect x="48" y="38" width="16" height="18" rx="4" fill="#FFD1E1" />
      <rect x="96" y="38" width="16" height="18" rx="4" fill="#BFE7FF" />
      <rect x="42" y="50" width="8" height="8" rx="2" fill="#FFFFFF" opacity=".8" />
      <rect x="110" y="52" width="8" height="8" rx="2" fill="#FFFFFF" opacity=".75" />
    </g>
    <path d="M40 128c18 14 62 14 80 0" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" opacity=".65" />
  </svg>
);

const ProfileAvatar = ({ compact = false, src = portfolioConfig.profile.avatarUrl }: { compact?: boolean; src?: string }) => (
  <img
    className={compact ? 'profile-avatar compact' : 'profile-avatar'}
    src={src}
    alt={uiLabels.profileAvatarAria}
    loading="lazy"
    decoding="async"
  />
);

const MemoryBoardImage = () => (
  <img
    className="memory-board-image"
    src="/images/soft-memory-board.png"
    alt={uiLabels.albumAria}
    loading="eager"
    decoding="async"
  />
);

const AlbumIllustration = () => (
  <svg className="album-art" viewBox="0 0 620 250" role="img" aria-label={uiLabels.albumAria}>
    <defs>
      <linearGradient id="albumGradient" x1="40" y1="20" x2="580" y2="230" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF8FC" />
        <stop offset=".48" stopColor="#FFE1EC" />
        <stop offset="1" stopColor="#D6F0FF" />
      </linearGradient>
      <filter id="albumShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="16" stdDeviation="16" floodColor="#BBDDF2" floodOpacity=".35" />
      </filter>
    </defs>
    <rect x="26" y="28" width="568" height="194" rx="42" fill="url(#albumGradient)" filter="url(#albumShadow)" />
    <rect x="50" y="52" width="140" height="122" rx="28" fill="#FFFFFF" opacity=".74" />
    <rect x="70" y="76" width="100" height="70" rx="20" fill="#CBEAFF" />
    <path d="M80 136c18-28 36-28 55 0 10-14 21-17 34 0" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
    <circle cx="145" cy="96" r="10" fill="#FFE1EC" />
    <rect x="220" y="72" width="150" height="98" rx="24" fill="#FFFFFF" opacity=".72" />
    <path d="M254 120c0-25 20-44 43-44s43 19 43 44" fill="#CFEFFF" />
    <rect x="258" y="111" width="78" height="48" rx="18" fill="#FFF8FC" />
    <circle cx="281" cy="127" r="4" fill="#60758F" />
    <circle cx="314" cy="127" r="4" fill="#60758F" />
    <path d="M290 142h15" stroke="#F4A6BC" strokeWidth="5" strokeLinecap="round" />
    <rect x="402" y="64" width="126" height="136" rx="30" fill="#FFFFFF" opacity=".7" />
    <path d="M432 95h66" stroke="#A8DDFB" strokeWidth="10" strokeLinecap="round" />
    <path d="M432 124h46" stroke="#FFD1E1" strokeWidth="10" strokeLinecap="round" />
    <path d="M432 153h72" stroke="#A8DDFB" strokeWidth="10" strokeLinecap="round" />
    <path d="M88 191h386" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity=".72" />
    <circle cx="536" cy="66" r="18" fill="#FFD0E0" opacity=".9" />
    <circle cx="552" cy="95" r="11" fill="#BFE7FF" opacity=".86" />
    <path d="M535 154 548 178 522 178Z" fill="#FFD0E0" opacity=".86" />
  </svg>
);

const CharacterStage = () => (
  <svg className="stage-character" viewBox="0 0 360 360" role="img" aria-label={uiLabels.stageAria}>
    <defs>
      <linearGradient id="stageAura" x1="60" y1="40" x2="300" y2="320" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFD3E3" />
        <stop offset="1" stopColor="#BAE6FF" />
      </linearGradient>
      <filter id="stageShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="26" stdDeviation="18" floodColor="#9FD5F5" floodOpacity=".34" />
      </filter>
    </defs>
    <circle cx="180" cy="178" r="136" fill="url(#stageAura)" opacity=".9" />
    <circle cx="180" cy="178" r="108" fill="rgba(255,255,255,.56)" />
    <g filter="url(#stageShadow)" shapeRendering="crispEdges">
      <rect x="112" y="86" width="136" height="50" rx="22" fill="#C7EAFF" />
      <rect x="96" y="122" width="168" height="118" rx="38" fill="#FFF7FB" />
      <rect x="124" y="104" width="112" height="42" rx="18" fill="#FFD4E4" />
      <rect x="84" y="144" width="34" height="54" rx="12" fill="#9ED8F8" />
      <rect x="242" y="144" width="34" height="54" rx="12" fill="#9ED8F8" />
      <rect x="136" y="156" width="18" height="18" rx="4" fill="#53657D" />
      <rect x="206" y="156" width="18" height="18" rx="4" fill="#53657D" />
      <rect x="146" y="193" width="22" height="8" rx="4" fill="#F3A9C0" />
      <rect x="192" y="193" width="22" height="8" rx="4" fill="#F3A9C0" />
      <path d="M168 184h24" stroke="#6B7D95" strokeWidth="8" strokeLinecap="round" />
      <rect x="126" y="232" width="108" height="44" rx="18" fill="#D4F0FF" />
      <rect x="144" y="252" width="72" height="14" rx="7" fill="#FFD4E4" />
      <rect x="92" y="86" width="42" height="42" rx="14" fill="#FFD4E4" />
      <rect x="226" y="86" width="42" height="42" rx="14" fill="#C7EAFF" />
    </g>
    <path d="M93 279c43 28 132 28 174 0" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" opacity=".74" />
  </svg>
);

function getCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: totalDays }, (_, index) => index + 1),
  ];
}

function getTimeGreeting(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) {
    return '早上好';
  }

  if (hour >= 11 && hour < 14) {
    return '中午好';
  }

  if (hour >= 14 && hour < 19) {
    return '下午好';
  }

  if (hour >= 19 && hour < 23) {
    return '晚上好';
  }

  return '夜深了';
}

function pageFromHash(): PageKey {
  const hash = window.location.hash.replace('#', '') as PageKey;
  return pageItems.some((item) => item.key === hash) || hash === 'project' ? hash : 'home';
}

function setHashPage(page: PageKey) {
  window.location.hash = page === 'home' ? '' : page;
}

function PageNav({ current, onNavigate }: { current: PageKey; onNavigate: (page: PageKey) => void }) {
  const navItems = pageItems.filter((item) => item.key !== 'article' && item.key !== 'avatar');
  const activeKey = current === 'article'
    ? 'blog'
    : current === 'project'
      ? 'projects'
      : current === 'avatar'
        ? 'home'
        : current;

  return (
    <nav className="page-nav" aria-label={uiLabels.pageNavAria}>
      {navItems.map((item) => (
        <button
          type="button"
          className={activeKey === item.key ? 'nav-pill active' : 'nav-pill'}
          aria-label={item.cn}
          title={item.cn}
          onClick={() => {
            onNavigate(item.key);
            setHashPage(item.key);
          }}
          key={item.key}
        >
          <Icon name={item.icon} />
          <span className="nav-label">{item.cn}</span>
        </button>
      ))}
    </nav>
  );
}

function PageHero({ eyebrow, title, desc, icon }: { eyebrow: string; title: string; desc: string; icon: IconName }) {
  return (
    <header className="page-hero glass-card">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      <div className="hero-mark">
        <Icon name={icon} />
      </div>
    </header>
  );
}

function DataStatePill({ content }: { content: FrontendContent }) {
  if (!content.isLoading && !content.isFallback) {
    return null;
  }

  return (
    <div className="data-state-pill" aria-live="polite">
      <Icon name={content.isLoading ? 'clock' : 'spark'} />
      <span>{content.isLoading ? '正在同步内容...' : content.errorMessage ?? '本地内容'}</span>
    </div>
  );
}

function PhotoGalleryModal({
  photos,
  activeIndex,
  onSelect,
  onPrevious,
  onNext,
  onClose,
  onNavigate,
}: {
  photos: readonly GalleryPhoto[];
  activeIndex: number | null;
  onSelect: (index: number | null) => void;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  onNavigate: (page: PageKey) => void;
}) {
  const activePhoto = activeIndex === null ? null : photos[activeIndex];
  const picturePlacements = [
    { x: 31, y: 25, w: 14, h: 17, rotate: -7 },
    { x: 42, y: 20, w: 15, h: 18, rotate: 5 },
    { x: 55, y: 25, w: 14, h: 17, rotate: -3 },
    { x: 67, y: 31, w: 15, h: 16, rotate: 6 },
    { x: 34, y: 42, w: 17, h: 13, rotate: 4 },
    { x: 48, y: 38, w: 16, h: 18, rotate: -6 },
    { x: 60, y: 43, w: 16, h: 13, rotate: 3 },
    { x: 73, y: 48, w: 14, h: 16, rotate: -5 },
    { x: 28, y: 58, w: 15, h: 13, rotate: 8 },
    { x: 41, y: 61, w: 16, h: 17, rotate: -4 },
    { x: 54, y: 59, w: 17, h: 15, rotate: 5 },
    { x: 67, y: 64, w: 16, h: 13, rotate: -7 },
    { x: 77, y: 67, w: 14, h: 16, rotate: 4 },
    { x: 36, y: 72, w: 17, h: 12, rotate: -5 },
    { x: 50, y: 75, w: 16, h: 14, rotate: 6 },
    { x: 63, y: 77, w: 15, h: 17, rotate: -3 },
    { x: 22, y: 38, w: 13, h: 14, rotate: 5 },
    { x: 80, y: 36, w: 13, h: 14, rotate: -6 },
  ] as const;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeIndex === null) {
          onClose();
        } else {
          onSelect(null);
        }
      }

      if (event.key === 'ArrowLeft' && activeIndex !== null) {
        onPrevious();
      }

      if (event.key === 'ArrowRight' && activeIndex !== null) {
        onNext();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, onClose, onNext, onPrevious, onSelect]);

  return (
    <div
      className="gallery-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          if (activeIndex === null) {
            onClose();
          } else {
            onSelect(null);
          }
        }
      }}
    >
      <section className="picture-wall" role="dialog" aria-modal="true" aria-label={uiLabels.galleryModalAria}>
        <PageNav
          current="home"
          onNavigate={(nextPage) => {
            onClose();
            onNavigate(nextPage);
          }}
        />
        <button type="button" className="picture-wall-close" onClick={onClose} aria-label={uiLabels.closeGalleryAria}>
          <Icon name="close" />
        </button>
        <div className="picture-wall-count" aria-hidden="true">
          {String(photos.length).padStart(2, '0')}
        </div>
        <div className="picture-wall-stage" aria-label={uiLabels.galleryModalAria}>
          {photos.map((photo, index) => (
            <button
              type="button"
              className={index === activeIndex ? 'picture-tile active' : 'picture-tile'}
              onClick={() => onSelect(index)}
              aria-label={`${uiLabels.galleryModalTitle} ${index + 1}`}
              key={photo.src}
              style={{
                '--tile-x': `${picturePlacements[index % picturePlacements.length].x}%`,
                '--tile-y': `${picturePlacements[index % picturePlacements.length].y}%`,
                '--tile-w': `${picturePlacements[index % picturePlacements.length].w}vw`,
                '--tile-h': `${picturePlacements[index % picturePlacements.length].h}vw`,
                '--tile-r': `${picturePlacements[index % picturePlacements.length].rotate}deg`,
                '--tile-delay': `${index * 170}ms`,
                '--tile-pop-x': `${index % 2 === 0 ? -10 : 10}px`,
                '--tile-pop-y': `${index % 3 === 0 ? 16 : -12}px`,
              } as CSSProperties}
            >
              <img src={photo.src} alt={photo.alt} />
            </button>
          ))}
        </div>
        {activePhoto && activeIndex !== null && (
          <div className="picture-focus-layer" role="presentation" onMouseDown={() => onSelect(null)}>
            <button
              type="button"
              className="picture-focus-card"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => onSelect(null)}
              aria-label={uiLabels.closeGalleryAria}
            >
              <img src={activePhoto.src} alt={activePhoto.alt} />
            </button>
            <button type="button" className="picture-nav prev" onClick={onPrevious} aria-label={uiLabels.previousPhotoAria}>
              <Icon name="chevronLeft" />
            </button>
            <button type="button" className="picture-nav next" onClick={onNext} aria-label={uiLabels.nextPhotoAria}>
              <Icon name="chevronRight" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function HomePage({
  now,
  notes,
  projects,
  resources,
  site,
  socialItems,
  onNavigate,
  onOpenArticle,
  onOpenProject,
  onOutboundClick,
  onCopyEmail,
  emailCopied,
  siteLike,
  onToggleSiteLike,
}: {
  now: Date;
  notes: DisplayNote[];
  projects: ProjectCard[];
  resources: ResourceCard[];
  site: RuntimeSite;
  socialItems: SocialLinkItem[];
  onNavigate: (page: PageKey) => void;
  onOpenArticle: (note: DisplayNote) => void;
  onOpenProject: (project: ProjectCard) => void;
  onOutboundClick: (targetType: 'share' | 'project' | 'social' | 'external', targetId: string | undefined, targetUrl: string) => void;
  onCopyEmail: () => void;
  emailCopied: boolean;
  siteLike: LikeState;
  onToggleSiteLike: () => void;
}) {
  const calendarDays = useMemo(() => getCalendarDays(now), [now]);
  const carouselStep = Math.floor(now.getTime() / 5000);
  const safeNotes = notes.length > 0 ? notes : fallbackContent.notes;
  const safeProjects = projects.length > 0 ? projects : fallbackContent.projects;
  const latestNoteIndex = carouselStep % safeNotes.length;
  const projectIndex = carouselStep % safeProjects.length;
  const recommendationIndex = carouselStep % Math.max(1, resources.length || homeRecommendations.length);
  const latestNote = safeNotes[latestNoteIndex];
  const featuredProject = safeProjects[projectIndex];
  const recommendationResource = resources.length > 0 ? resources[recommendationIndex % resources.length] : null;
  const recommendation = recommendationResource
    ? `${recommendationResource.title}：${recommendationResource.desc}`
    : homeRecommendations[recommendationIndex % homeRecommendations.length];
  const galleryPhotos = site.galleryPhotos.length > 0 ? site.galleryPhotos : homeGalleryPhotos;
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const timeGreeting = getTimeGreeting(now);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const showPreviousPhoto = useCallback(() => {
    setActivePhotoIndex((current) => (
      current === null
        ? galleryPhotos.length - 1
        : (current - 1 + galleryPhotos.length) % galleryPhotos.length
    ));
  }, [galleryPhotos]);
  const showNextPhoto = useCallback(() => {
    setActivePhotoIndex((current) => (
      current === null
        ? 0
        : (current + 1) % galleryPhotos.length
    ));
  }, [galleryPhotos]);

  return (
    <>
    <section className="bento-shell">
      <aside className="glass-card sidebar-card">
        <div className="sidebar-profile">
          <ProfileAvatar compact src={site.avatarUrl} />
          <div>
            <p className="eyebrow">{homeContent.site.eyebrow}</p>
            <h1>{site.profileName}</h1>
          </div>
        </div>
        <span className="status-pill">{site.homeStatus}</span>
        <div className="side-menu" aria-label={uiLabels.homeMenuAria}>
          {homeMenuItems.map((item, index) => (
            <button
              type="button"
              className={index === 0 ? 'menu-item active' : 'menu-item'}
              onClick={() => {
                onNavigate(item.page);
                setHashPage(item.page);
              }}
              key={`${item.page}-${item.label}`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="side-mini-switch">
          {homeContent.quickLinks.map((item) => (
            <button type="button" onClick={() => {
              onNavigate(item.page);
              setHashPage(item.page);
            }} key={item.page}>{item.label}</button>
          ))}
        </div>
      </aside>

      <button
        type="button"
        className="glass-card gallery-card"
        onClick={() => {
          setActivePhotoIndex(null);
          setIsGalleryOpen(true);
        }}
        aria-label={uiLabels.openGalleryAria}
      >
        <MemoryBoardImage />
        <span className="gallery-card-mark" aria-hidden="true">
          <Icon name="image" />
        </span>
      </button>

      <section className="glass-card intro-card">
        <div className="intro-avatar-wrap">
          <ProfileAvatar src={site.avatarUrl} />
        </div>
        <div className="intro-copy">
          <p className="eyebrow">{homeContent.intro.eyebrow}</p>
          <h2>
            {timeGreeting}，我是<span>{site.headingAccent}</span>
          </h2>
        </div>
      </section>

      <section className="glass-card social-card">
        <div className="card-heading">
          <p className="eyebrow">{homeContent.social.eyebrow}</p>
          <h2>{homeContent.social.title}</h2>
        </div>
        <div className="social-grid">
          {socialItems.map((social) => (
            social.href === 'email' ? (
              <button
                type="button"
                className={emailCopied ? 'social-button copied' : 'social-button'}
                onClick={onCopyEmail}
                aria-label={uiLabels.copyEmailAria}
                key={social.label}
              >
                <Icon name={social.icon} />
                <span>{emailCopied ? uiLabels.emailCopied : social.label}</span>
              </button>
            ) : (
              <a href={social.href} className="social-button" key={social.label} target="_blank" rel="noreferrer" onClick={() => onOutboundClick('social', social.label, social.href)}>
                <Icon name={social.icon} />
                <span>{social.label}</span>
              </a>
            )
          ))}
        </div>
      </section>

      <section className="glass-card clock-card nollning-clock" aria-label={uiLabels.clockAria}>
        <div className="digital-screen">
          <time className="digital-time" aria-label={`${hh}:${mm}:${ss}`}>
            <SevenSegmentTime value={`${hh}:${mm}:${ss}`} />
          </time>
        </div>
      </section>

      <section className="glass-card calendar-card">
        <div className="calendar-header">
          <div>
            <p className="eyebrow">{homeContent.calendar.eyebrow}</p>
            <h2>
              {now.getFullYear()} / {String(now.getMonth() + 1).padStart(2, '0')}
            </h2>
          </div>
          <Icon name="calendar" />
        </div>
        <div className="weekday-grid">
          {uiLabels.weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="date-grid">
          {calendarDays.map((day, index) => (
            <span className={day === now.getDate() ? 'today' : ''} key={`${day ?? 'blank'}-${index}`}>
              {day}
            </span>
          ))}
        </div>
      </section>

      <section className="glass-card articles-card">
        <div className="card-heading row">
          <div>
            <p className="eyebrow">{homeContent.articles.eyebrow}</p>
            <h2>{homeContent.articles.title}</h2>
          </div>
          <span className="count-bubble">{safeNotes.length}</span>
        </div>
        <div className="article-list">
          <button type="button" key={latestNote.slug} className="article-item" onClick={() => onOpenArticle(latestNote)}>
            <time>{latestNote.date}</time>
            <h3>{latestNote.title.zh}</h3>
            <p>{latestNote.summary.zh}</p>
          </button>
          <div className="carousel-dots" aria-hidden="true">
            {safeNotes.slice(0, 3).map((note, index) => (
              <span className={index === latestNoteIndex % 3 ? 'active' : ''} key={note.slug} />
            ))}
          </div>
        </div>
      </section>

      <section className="glass-card projects-card">
        <div className="card-heading">
          <p className="eyebrow">{homeContent.projects.eyebrow}</p>
          <h2>{homeContent.projects.title}</h2>
        </div>
        <div className="project-stack">
          <button type="button" className="project-chip" key={featuredProject.name} onClick={() => onOpenProject(featuredProject)}>
            <span>0{projectIndex + 1}</span>
            <div>
              <h3>{featuredProject.name}</h3>
              <p>{featuredProject.tags.slice(0, 3).join(' / ')}</p>
            </div>
          </button>
          <div className="carousel-dots" aria-hidden="true">
            {safeProjects.slice(0, 3).map((project, index) => (
              <span className={index === projectIndex % 3 ? 'active' : ''} key={project.name} />
            ))}
          </div>
        </div>
      </section>

      <section className="glass-card recommend-card">
        <div className="mini-title">
          <Icon name="spark" />
          <span>{homeContent.recommendation.eyebrow}</span>
        </div>
        <h2>{homeContent.recommendation.title}</h2>
        <p>{recommendation}</p>
        <div className="carousel-dots" aria-hidden="true">
          {(recommendationResource ? resources : homeRecommendations).slice(0, 6).map((item, index) => (
            <span
              className={index === recommendationIndex % 6 ? 'active' : ''}
              key={typeof item === 'string' ? item : item.href}
            />
          ))}
        </div>
        <button type="button" onClick={() => onNavigate('share')}>{homeContent.recommendation.buttonLabel}</button>
      </section>

      <MusicPlayer tracks={site.musicTracks} />

      <section className="glass-card like-card">
        <button
          type="button"
          className={siteLike.liked ? 'like-orb liked' : 'like-orb'}
          onClick={onToggleSiteLike}
          aria-label={siteLike.liked ? uiLabels.unlikeSiteAria : uiLabels.likeSiteAria}
        >
          <Icon name="heart" />
        </button>
        <div>
          <p className="eyebrow">{uiLabels.siteLikeLabel}</p>
          <h2>{formatLikeCount(siteLike.count)}</h2>
        </div>
        <span className="tiny-bubble">{siteLike.liked ? uiLabels.likedState : uiLabels.likeAction}</span>
      </section>
    </section>
    {isGalleryOpen && createPortal(
      <PhotoGalleryModal
        photos={galleryPhotos}
        activeIndex={activePhotoIndex}
        onSelect={setActivePhotoIndex}
        onPrevious={showPreviousPhoto}
        onNext={showNextPhoto}
        onClose={() => setIsGalleryOpen(false)}
        onNavigate={onNavigate}
      />,
      document.body,
    )}
    </>
  );
}

function BlogPage({
  notes,
  archiveGroups,
  resources,
  onOpenArticle,
  onOutboundClick,
}: {
  notes: DisplayNote[];
  archiveGroups: ArchiveGroup[];
  resources: ResourceCard[];
  onOpenArticle: (note: DisplayNote) => void;
  onOutboundClick: (targetType: 'share', targetId: string | undefined, targetUrl: string) => void;
}) {
  const noteList = notes.length > 0 ? notes : fallbackContent.notes;
  const groups = archiveGroups.length > 0 ? archiveGroups : fallbackContent.archiveGroups;
  const resourceList = resources.length > 0 ? resources : fallbackContent.resources;
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ articles: DisplayNote[]; resources: ResourceCard[] } | null>(null);
  const trimmedQuery = searchQuery.trim();
  const visibleSearchResults = trimmedQuery.length >= 2 ? searchResults : null;
  const visibleIsSearching = trimmedQuery.length >= 2 && isSearching;

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      searchPublicContent(trimmedQuery, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) {
            return;
          }

          if (result) {
            setSearchResults({
              articles: result.articles.map(apiArticleToNote),
              resources: result.shares.map(apiShareToResource),
            });
            return;
          }

          const lowerQuery = trimmedQuery.toLowerCase();
          setSearchResults({
            articles: noteList.filter((note) => (
              note.title.zh.toLowerCase().includes(lowerQuery)
              || note.summary.zh.toLowerCase().includes(lowerQuery)
              || note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
            )),
            resources: resourceList.filter((resource) => (
              resource.title.toLowerCase().includes(lowerQuery)
              || resource.desc.toLowerCase().includes(lowerQuery)
              || resource.category.toLowerCase().includes(lowerQuery)
            )),
          });
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearching(false);
          }
        });
    }, 260);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [noteList, resourceList, trimmedQuery]);

  return (
    <section className="page-shell">
      <PageHero {...pageHeroes.blog} />
      <div className="filter-bar glass-card">
        {filterItems.map((item, index) => (
          <button type="button" className={index === 3 ? 'filter-chip active' : 'filter-chip'} key={item}>
            {item}
          </button>
        ))}
        <input
          className="soft-search-input"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          placeholder="搜索文章 / 分享"
          aria-label="搜索文章和分享"
        />
      </div>
      {trimmedQuery.length >= 2 && (
        <section className="search-results-card glass-card">
          <div className="mini-title">
            <Icon name="spark" />
            <span>{visibleIsSearching ? '搜索中...' : `Search · ${trimmedQuery}`}</span>
          </div>
          {!visibleIsSearching && visibleSearchResults && visibleSearchResults.articles.length === 0 && visibleSearchResults.resources.length === 0 && (
            <p className="empty-copy">没有找到相关内容。</p>
          )}
          {!visibleIsSearching && visibleSearchResults && visibleSearchResults.articles.length > 0 && (
            <div className="search-result-group">
              {visibleSearchResults.articles.map((note) => (
                <button type="button" className="post-row" onClick={() => onOpenArticle(note)} key={note.slug}>
                  <time>{note.date}</time>
                  <h3>{note.title.zh}</h3>
                  <div className="tag-row">
                    {note.tags.map((tag) => <span className="soft-tag" key={tag}>{tag}</span>)}
                  </div>
                </button>
              ))}
            </div>
          )}
          {!visibleIsSearching && visibleSearchResults && visibleSearchResults.resources.length > 0 && (
            <div className="search-resource-row">
              {visibleSearchResults.resources.map((resource) => (
                <a className="glass-action" href={resource.href} target="_blank" rel="noreferrer" onClick={() => onOutboundClick('share', resource.id ?? resource.title, resource.href)} key={resource.href}>
                  <Icon name={resource.icon} />
                  {resource.title}
                </a>
              ))}
            </div>
          )}
        </section>
      )}
      {groups.length === 0 && trimmedQuery.length < 2 && (
        <section className="empty-state glass-card">
          <Icon name="book" />
          <p>还没有发布文章。</p>
        </section>
      )}
      <div className="archive-stack">
        {groups.map((group) => (
          <article className="year-card glass-card" key={group.year}>
            <div className="year-head">
              <div>
                <p className="eyebrow">{uiLabels.archiveEyebrow}</p>
                <h2>{group.year}</h2>
              </div>
              <span>{group.count} {uiLabels.postCountSuffix}</span>
            </div>
            <div className="post-rows">
              {group.posts.map((post) => {
                const linkedNote = noteList.find((note) => note.title.zh === post.title);
                const archiveNote = linkedNote ?? {
                  slug: `${group.year}-${post.date}-${post.title}`,
                  title: { zh: post.title, en: post.title },
                  summary: {
                    zh: `这是一篇关于 ${post.tags.join(' / ')} 的归档文章。`,
                    en: post.title,
                  },
                  date: `${group.year}-${post.date.replace('.', '-')}`,
                  tags: [...post.tags],
                };

                return (
                  <button
                    type="button"
                    className="post-row"
                    onClick={() => onOpenArticle(archiveNote)}
                    key={`${group.year}-${post.date}`}
                  >
                    <time>{post.date}</time>
                    <h3>{post.title}</h3>
                    <div className="tag-row">
                      {post.tags.map((tag) => (
                        <span className="soft-tag" key={tag}>{tag}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProjectsPage({
  projects,
  onOpenProject,
  onOutboundClick,
}: {
  projects: ProjectCard[];
  onOpenProject: (project: ProjectCard) => void;
  onOutboundClick: (targetType: 'project', targetId: string | undefined, targetUrl: string) => void;
}) {
  const projectList = projects.length > 0 ? projects : fallbackContent.projects;

  return (
    <section className="page-shell">
      <PageHero {...pageHeroes.projects} />
      {projectList.length === 0 && (
        <section className="empty-state glass-card">
          <Icon name="folder" />
          <p>还没有发布项目。</p>
        </section>
      )}
      <div className="portfolio-grid">
        {projectList.map((project, index) => (
          <article className="portfolio-card glass-card" key={project.name}>
            <div className="project-icon">{project.icon}</div>
            <div className="project-title-row">
              <div>
                <p className="eyebrow">{project.year}</p>
                <h2>{project.name}</h2>
              </div>
              <span className="index-badge">0{index + 1}</span>
            </div>
            <p>{project.desc}</p>
            <div className="tag-row">
              {project.tags.map((tag) => (
                <span className="soft-tag" key={tag}>{tag}</span>
              ))}
            </div>
            <div className="action-row">
              <button className="glass-action" type="button" onClick={() => onOpenProject(project)}>
                <Icon name="pen" />
                {uiLabels.detailAction}
              </button>
              <a className="glass-action" href={project.website} target="_blank" rel="noreferrer" onClick={() => onOutboundClick('project', project.id ?? project.slug, project.website)}>
                <Icon name="external" />
                {uiLabels.projectWebsite}
              </a>
              <a className="glass-action" href={project.github} target="_blank" rel="noreferrer" onClick={() => onOutboundClick('project', project.id ?? project.slug, project.github)}>
                <Icon name="github" />
                {uiLabels.projectGithub}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProjectDetailPage({
  project,
  onNavigate,
  onOutboundClick,
}: {
  project: ProjectCard;
  onNavigate: (page: PageKey) => void;
  onOutboundClick: (targetType: 'project', targetId: string | undefined, targetUrl: string) => void;
}) {
  const hasMarkdownContent = Boolean(project.contentMarkdown?.trim());

  return (
    <section className="article-layout">
      <article className="reader-card glass-card">
        <div className="article-cover project-detail-cover">
          <div className="project-detail-mark">{project.icon}</div>
          <AlbumIllustration />
        </div>
        <div className="article-meta-line">
          <span className="soft-tag">{project.year}</span>
          {project.tags.slice(0, 4).map((tag) => (
            <span className="soft-tag" key={tag}>{tag}</span>
          ))}
        </div>
        <h1>{project.name}</h1>
        <p className="article-lead">{project.desc}</p>
        <div className="article-body">
          <section>
            <h2 id="project-overview">{uiLabels.projectOverviewTitle}</h2>
            {hasMarkdownContent ? renderMarkdownLite(project.contentMarkdown ?? '') : <p>{project.desc}</p>}
          </section>
          <section>
            <h2 id="project-stack">{uiLabels.projectStackTitle}</h2>
            <div className="tag-row detail-tag-row">
              {project.tags.map((tag) => (
                <span className="soft-tag" key={tag}>{tag}</span>
              ))}
            </div>
          </section>
          <section>
            <h2 id="project-links">{uiLabels.projectLinksTitle}</h2>
            <div className="action-row">
              <a className="glass-action" href={project.website} target="_blank" rel="noreferrer" onClick={() => onOutboundClick('project', project.id ?? project.slug, project.website)}>
                <Icon name="external" />
                {uiLabels.projectWebsite}
              </a>
              <a className="glass-action" href={project.github} target="_blank" rel="noreferrer" onClick={() => onOutboundClick('project', project.id ?? project.slug, project.github)}>
                <Icon name="github" />
                {uiLabels.projectGithub}
              </a>
            </div>
          </section>
        </div>
      </article>
      <aside className="reader-aside">
        <section className="aside-card glass-card">
          <div className="aside-thumb project-aside-icon">
            <span>{project.icon}</span>
          </div>
          <h2>{uiLabels.projectSummaryTitle}</h2>
          <p>{project.desc}</p>
        </section>
        <section className="aside-card glass-card toc-card">
          <div className="mini-title">
            <Icon name="list" />
            <span>{articleDetailContent.aside.tocTitle}</span>
          </div>
          <a className="active" href="#project-overview">{uiLabels.projectOverviewTitle}</a>
          <a href="#project-stack">{uiLabels.projectStackTitle}</a>
          <a href="#project-links">{uiLabels.projectLinksTitle}</a>
        </section>
        <section className="aside-card glass-card like-aside">
          <button type="button" onClick={() => onNavigate('projects')}><Icon name="folder" /></button>
          <span>{uiLabels.backToProjects}</span>
        </section>
      </aside>
    </section>
  );
}

function AboutPage({
  site,
  onCopyEmail,
  emailCopied,
  onOutboundClick,
}: {
  site: RuntimeSite;
  onCopyEmail: () => void;
  emailCopied: boolean;
  onOutboundClick: (targetType: 'social', targetId: string | undefined, targetUrl: string) => void;
}) {
  return (
    <section className="page-shell calm-page">
      <article className="about-note glass-card">
        <div className="about-top">
          <ProfileAvatar src={site.avatarUrl} />
          <div>
            <p className="eyebrow">{aboutContent.eyebrow}</p>
            <h1>{aboutContent.title}</h1>
            <p>{aboutContent.intro}</p>
            <div className="github-stats" aria-label="GitHub profile stats">
              <span>{portfolioConfig.profile.publicRepos} {uiLabels.githubReposLabel}</span>
              <span>{portfolioConfig.profile.followers} {uiLabels.githubFollowersLabel}</span>
              <span>{uiLabels.githubSinceLabel} {portfolioConfig.profile.githubCreatedAt}</span>
            </div>
          </div>
        </div>
        <div className="soft-prose">
          {aboutContent.blocks.map((block) => (
            block.type === 'quote' ? (
              <blockquote key={block.body}>{block.body}</blockquote>
            ) : (
              <section key={block.title}>
                <h2>{block.title}</h2>
                <p>{block.body}</p>
              </section>
            )
          ))}
        </div>
        <div className="round-actions">
          <a href={site.github} target="_blank" rel="noreferrer" aria-label={uiLabels.githubAria} onClick={() => onOutboundClick('social', 'GitHub', site.github)}>
            <Icon name="github" />
          </a>
          <button
            type="button"
            className={emailCopied ? 'copied' : undefined}
            onClick={onCopyEmail}
            aria-label={emailCopied ? uiLabels.emailCopied : uiLabels.copyEmailAria}
          >
            <Icon name="mail" />
          </button>
          <button type="button" aria-label={uiLabels.likeAria}>
            <Icon name="heart" />
          </button>
        </div>
      </article>
    </section>
  );
}

function SharePage({
  resources,
  onOutboundClick,
}: {
  resources: ResourceCard[];
  onOutboundClick: (targetType: 'share', targetId: string | undefined, targetUrl: string) => void;
}) {
  const resourceList = resources.length > 0 ? resources : fallbackContent.resources;
  const resourceFilters = useMemo(
    () => ['全部', ...Array.from(new Set(resourceList.map((resource) => resource.category)))],
    [resourceList],
  );
  const [activeFilter, setActiveFilter] = useState<string>('全部');
  const activeResourceFilter = resourceFilters.includes(activeFilter) ? activeFilter : '全部';
  const visibleResources = activeResourceFilter === '全部'
    ? resourceList
    : resourceList.filter((resource) => resource.category === activeResourceFilter);

  return (
    <section className="page-shell">
      <PageHero {...pageHeroes.share} />
      <div className="filter-bar glass-card">
        {resourceFilters.map((item) => (
          <button
            type="button"
            className={activeResourceFilter === item ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setActiveFilter(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="resource-grid">
        {visibleResources.length === 0 && (
          <section className="empty-state glass-card">
            <Icon name="spark" />
            <p>还没有分享内容。</p>
          </section>
        )}
        {visibleResources.map((resource, index) => (
          <article className={index < 2 ? 'resource-card glass-card featured-resource' : 'resource-card glass-card'} key={resource.title}>
            <div className="resource-icon">
              <Icon name={resource.icon as IconName} />
            </div>
            <div>
              <span className="soft-tag">{resource.category}</span>
              <h2>{resource.title}</h2>
              <a href={resource.href} target="_blank" rel="noreferrer" onClick={() => onOutboundClick('share', resource.id ?? resource.title, resource.href)}>{resource.url}</a>
              <p>{resource.desc}</p>
            </div>
            <div className="resource-meta">
              <span><Icon name="eye" /> {resource.views} {uiLabels.views}</span>
              <span><Icon name="bookmark" /> {resource.marks} {uiLabels.marks}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BloggersPage({ friendLinks }: { friendLinks: FriendCard[] }) {
  const friendList = friendLinks.length > 0 ? friendLinks : fallbackContent.friendLinks;

  return (
    <section className="page-shell">
      <PageHero {...pageHeroes.bloggers} />
      <div className="toggle-card glass-card">
        <button type="button" className="filter-chip active">{uiLabels.bloggersPrimaryTab}</button>
        <button type="button" className="filter-chip">{uiLabels.bloggersSecondaryTab}</button>
        <span>{uiLabels.bloggersCountPrefix} {friendList.length} {uiLabels.bloggersCountSuffix}</span>
      </div>
      <div className="friend-grid">
        {friendList.length === 0 && (
          <section className="empty-state glass-card">
            <Icon name="heart" />
            <p>还没有友链。</p>
          </section>
        )}
        {friendList.map((friend, index) => (
          <article className={index < 2 ? 'friend-card glass-card friend-large' : 'friend-card glass-card'} key={friend.name}>
            <div className={`friend-avatar ${friend.tone}`}>
              {friend.avatarUrl ? <img src={friend.avatarUrl} alt="" /> : <PixelAvatar compact />}
            </div>
            <div>
              <h2>{friend.name}</h2>
              <a href={friend.href} target="_blank" rel="noreferrer">{friend.url}</a>
              <p>{friend.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ArticlePage({
  note,
  like,
  onToggleLike,
}: {
  note: DisplayNote;
  like: LikeState;
  onToggleLike: (note: DisplayNote) => void;
}) {
  const hasMarkdownContent = Boolean(note.contentMarkdown?.trim());

  return (
    <section className="article-layout">
      <article className="reader-card glass-card">
        <div className="article-cover">
          {note.coverUrl ? (
            <img className="article-cover-image" src={note.coverUrl} alt="" />
          ) : (
            <AlbumIllustration />
          )}
        </div>
        <div className="article-meta-line">
          {note.tags.map((tag) => (
            <span className="soft-tag" key={tag}>{tag}</span>
          ))}
          <time>{note.date}</time>
        </div>
        <h1>{note.title.zh}</h1>
        <p className="article-lead">{note.summary.zh}</p>
        <div className="article-body">
          {hasMarkdownContent ? (
            renderMarkdownLite(note.contentMarkdown ?? '')
          ) : (
            articleDetailContent.sections.map((section) => (
              <section key={section.id}>
                <h2 id={section.id}>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {'list' in section && (
                  <ul>
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {'figure' in section && (
                  <div className="inline-figure">
                    <Icon name="image" />
                    <span>{section.figure}</span>
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      </article>
      <aside className="reader-aside">
        <section className="aside-card glass-card">
          <div className="aside-thumb">
            <ProfileAvatar compact />
          </div>
          <h2>{articleDetailContent.aside.summaryTitle}</h2>
          <p>{note.summary.zh}</p>
        </section>
        <section className="aside-card glass-card toc-card">
          <div className="mini-title">
            <Icon name="list" />
            <span>{articleDetailContent.aside.tocTitle}</span>
          </div>
          {hasMarkdownContent ? (
            <a className="active" href="#">{note.title.zh}</a>
          ) : (
            articleDetailContent.sections.map((section, index) => (
              <a className={index === 0 ? 'active' : ''} href={`#${section.id}`} key={section.id}>{section.title}</a>
            ))
          )}
        </section>
        <section className="aside-card glass-card like-aside">
          <button
            type="button"
            className={like.liked ? 'liked' : undefined}
            onClick={() => onToggleLike(note)}
            aria-label={like.liked ? uiLabels.unlikeArticleAria : uiLabels.likeArticleAria}
          >
            <Icon name="heart" />
          </button>
          <span>{formatLikeCount(like.count)} {uiLabels.articleLikeLabel}</span>
        </section>
      </aside>
    </section>
  );
}

function AvatarPage() {
  return (
    <section className="avatar-page">
      <div className="stage-card glass-card">
        <span className="stage-spark spark-a" />
        <span className="stage-spark spark-b" />
        <span className="stage-heart" />
        <CharacterStage />
        <div className="stage-copy">
          <p className="eyebrow">{avatarContent.eyebrow}</p>
          <h1>{avatarContent.title}</h1>
          <p>{avatarContent.description}</p>
          <span className="loading-pill">{avatarContent.loading}</span>
        </div>
      </div>
    </section>
  );
}

function PublicApp() {
  const content = useFrontendContent();
  const socialItems = useMemo(() => createSocials(content.site.github), [content.site.github]);
  const likeClientId = useMemo(() => getLikeClientId(), []);
  const [page, setPage] = useState<PageKey>(() => pageFromHash());
  const [renderedPage, setRenderedPage] = useState<PageKey>(() => pageFromHash());
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [now, setNow] = useState(() => new Date());
  const [selectedArticle, setSelectedArticle] = useState<DisplayNote>(() => fallbackContent.notes[0]);
  const [selectedProjectName, setSelectedProjectName] = useState(() => fallbackContent.projects[0]?.name ?? '');
  const [emailCopied, setEmailCopied] = useState(false);
  const [siteLike, setSiteLike] = useState<LikeState>(() => readLikeState(SITE_LIKE_STORAGE_KEY, SITE_LIKE_BASE_COUNT));
  const [articleLikes, setArticleLikes] = useState<Record<string, LikeState>>({});
  const renderedPageRef = useRef(renderedPage);
  const transitionTimers = useRef<number[]>([]);
  const emailCopyTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handleHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (page === renderedPageRef.current) {
      return undefined;
    }

    transitionTimers.current.forEach((timer) => window.clearTimeout(timer));
    setTransitionPhase('exit');

    const swapTimer = window.setTimeout(() => {
      renderedPageRef.current = page;
      setRenderedPage(page);
      window.scrollTo({ top: 0, behavior: 'auto' });
      setTransitionPhase('enter');

      const enterTimer = window.setTimeout(() => {
        setTransitionPhase('idle');
      }, 420);

      transitionTimers.current = [enterTimer];
    }, 180);

    transitionTimers.current = [swapTimer];

    return () => {
      transitionTimers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, [page]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    recordPageView(likeClientId, `${window.location.pathname}${window.location.hash}`, document.referrer || undefined)
      .catch(() => undefined);
  }, [likeClientId, renderedPage, selectedArticle.slug, selectedProjectName]);

  useEffect(() => {
    const controller = new AbortController();

    fetchSiteLikeStatus(likeClientId, controller.signal)
      .then((status) => {
        const next = { count: status.count, liked: status.liked };
        setSiteLike(next);
        writeLikeState(SITE_LIKE_STORAGE_KEY, next);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [likeClientId]);

  useEffect(() => {
    if (renderedPage !== 'article') {
      return undefined;
    }

    const controller = new AbortController();

    fetchArticleLikeStatus(selectedArticle.slug, likeClientId, controller.signal)
      .then((status) => {
        const next = { count: status.count, liked: status.liked };
        setArticleLikes((current) => ({
          ...current,
          [selectedArticle.slug]: next,
        }));
        writeLikeState(getArticleLikeStorageKey(selectedArticle.slug), next);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [likeClientId, renderedPage, selectedArticle.slug]);

  useEffect(() => (
    () => {
      if (emailCopyTimer.current) {
        window.clearTimeout(emailCopyTimer.current);
      }
    }
  ), []);

  const handleNavigate = (nextPage: PageKey) => {
    if (nextPage === page) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setPage(nextPage);
  };

  const handleOpenArticle = (note: DisplayNote) => {
    setSelectedArticle(note);
    setHashPage('article');
    handleNavigate('article');

    const controller = new AbortController();

    Promise.allSettled([
      fetchArticleDetail(note.slug, controller.signal),
      fetchArticleLikeStatus(note.slug, likeClientId, controller.signal),
    ])
      .then(([articleResult, likeResult]) => {
        if (articleResult.status === 'fulfilled' && articleResult.value) {
          setSelectedArticle(apiArticleToNote(articleResult.value));
        }

        if (likeResult.status === 'fulfilled') {
          const next = { count: likeResult.value.count, liked: likeResult.value.liked };
          setArticleLikes((current) => ({
            ...current,
            [note.slug]: next,
          }));
          writeLikeState(getArticleLikeStorageKey(note.slug), next);
        }
      })
      .catch(() => undefined);
  };

  const handleOpenProject = (project: ProjectCard) => {
    setSelectedProjectName(project.name);
    setHashPage('project');
    handleNavigate('project');
  };

  const handleOutboundClick = (
    targetType: 'share' | 'project' | 'social' | 'external',
    targetId: string | undefined,
    targetUrl: string,
  ) => {
    recordOutboundClick(likeClientId, {
      target_type: targetType,
      target_id: targetId,
      target_url: targetUrl,
    }).catch(() => undefined);
  };

  const handleCopyEmail = () => {
    copyTextToClipboard(content.site.email)
      .then(() => {
        setEmailCopied(true);

        if (emailCopyTimer.current) {
          window.clearTimeout(emailCopyTimer.current);
        }

        emailCopyTimer.current = window.setTimeout(() => {
          setEmailCopied(false);
        }, 1600);
      })
      .catch((error: unknown) => {
        console.warn('Unable to copy email address', error);
      });
  };

  const handleToggleSiteLike = () => {
    const next = toggleLike(siteLike);
    setSiteLike(next);
    writeLikeState(SITE_LIKE_STORAGE_KEY, next);

    setSiteLikeStatus(likeClientId, next.liked)
      .then((status) => {
        const serverState = { count: status.count, liked: status.liked };
        setSiteLike(serverState);
        writeLikeState(SITE_LIKE_STORAGE_KEY, serverState);
      })
      .catch(() => undefined);
  };

  const handleToggleArticleLike = (note: DisplayNote) => {
    const storageKey = getArticleLikeStorageKey(note.slug);
    const current = articleLikes[note.slug]
      ?? readLikeState(storageKey, note.likeCount ?? ARTICLE_LIKE_BASE_COUNT);
    const next = toggleLike(current);

    setArticleLikes((currentLikes) => ({
      ...currentLikes,
      [note.slug]: next,
    }));
    writeLikeState(storageKey, next);

    setArticleLikeStatus(note.slug, likeClientId, next.liked)
      .then((status) => {
        const serverState = { count: status.count, liked: status.liked };
        setArticleLikes((currentLikes) => ({
          ...currentLikes,
          [note.slug]: serverState,
        }));
        writeLikeState(storageKey, serverState);
      })
      .catch(() => undefined);
  };

  const selectedProject = content.projects.find((project) => project.name === selectedProjectName)
    ?? content.projects[0]
    ?? fallbackContent.projects[0];
  const selectedArticleLike = articleLikes[selectedArticle.slug]
    ?? readLikeState(getArticleLikeStorageKey(selectedArticle.slug), selectedArticle.likeCount ?? ARTICLE_LIKE_BASE_COUNT);

  const pageContent = {
    home: (
      <HomePage
        now={now}
        notes={content.notes}
        projects={content.projects}
        resources={content.resources}
        site={content.site}
        socialItems={socialItems}
        onNavigate={handleNavigate}
        onOpenArticle={handleOpenArticle}
        onOpenProject={handleOpenProject}
        onOutboundClick={handleOutboundClick}
        onCopyEmail={handleCopyEmail}
        emailCopied={emailCopied}
        siteLike={siteLike}
        onToggleSiteLike={handleToggleSiteLike}
      />
    ),
    blog: <BlogPage notes={content.notes} archiveGroups={content.archiveGroups} resources={content.resources} onOpenArticle={handleOpenArticle} onOutboundClick={handleOutboundClick} />,
    projects: <ProjectsPage projects={content.projects} onOpenProject={handleOpenProject} onOutboundClick={handleOutboundClick} />,
    project: <ProjectDetailPage project={selectedProject} onNavigate={handleNavigate} onOutboundClick={handleOutboundClick} />,
    about: <AboutPage site={content.site} onCopyEmail={handleCopyEmail} emailCopied={emailCopied} onOutboundClick={handleOutboundClick} />,
    share: <SharePage resources={content.resources} onOutboundClick={handleOutboundClick} />,
    bloggers: <BloggersPage friendLinks={content.friendLinks} />,
    article: <ArticlePage note={selectedArticle} like={selectedArticleLike} onToggleLike={handleToggleArticleLike} />,
    avatar: <AvatarPage />,
  }[renderedPage];

  return (
    <main className={renderedPage === 'home' ? 'site-canvas home-canvas' : 'site-canvas'} aria-label={uiLabels.siteCanvas}>
      <div className="soft-glow glow-pink" />
      <div className="soft-glow glow-blue" />
      <div className="soft-glow glow-mini" />
      {renderedPage === 'home' && (
        <>
          <div className="sticker sticker-heart" aria-hidden="true" />
          <div className="sticker sticker-star" aria-hidden="true" />
          <div className="sticker sticker-spark" aria-hidden="true" />
        </>
      )}
      {renderedPage !== 'home' && <PageNav current={page} onNavigate={handleNavigate} />}
      <DataStatePill content={content} />
      <div className={`page-transition page-transition-${transitionPhase}`} key={renderedPage}>
        {pageContent}
      </div>
    </main>
  );
}

function App() {
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin';

  if (isAdminRoute) {
    return <AdminApp />;
  }

  return <PublicApp />;
}

export default App;
