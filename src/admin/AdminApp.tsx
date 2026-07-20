import { useCallback, useEffect, useMemo, useState, type Dispatch, type DragEvent, type FormEvent, type SetStateAction } from 'react';
import { adminLogin, adminLogout, changeAdminPassword, getCurrentAdmin, type AdminProfile } from '../api/admin';
import { ApiError } from '../api/client';
import type { ApiArticle, ApiCategory, ApiFriendLink, ApiProject, ApiShare, ApiTag } from '../api/content';
import {
  archiveItem,
  createCategory,
  createTag,
  deleteUpload,
  deleteItem,
  getAdminAnalytics,
  getDashboard,
  getSiteConfig,
  listCategories,
  listAdminArticles,
  listAdminFriendLinks,
  listAdminProjects,
  listAdminShares,
  listTags,
  listUploads,
  restoreItem,
  updateSiteConfig,
  uploadAdminImage,
  uploadAdminFile,
  type AnalyticsData,
  type DashboardData,
  type TaxonomyPayload,
  type UploadedFile,
} from '../api/adminContent';
import { adminSectionPath, parseAdminRoute, type AdminSection } from './adminRoutes';
import { ContentWorkspace } from './content/ContentWorkspace';
import './AdminApp.css';

type AdminTab = AdminSection;

type AdminMessage = {
  type: 'success' | 'error' | 'info';
  text: string;
};

type SiteFormState = {
  profileName: string;
  avatarUrl: string;
  headingAccent: string;
  homeStatus: string;
  github: string;
  email: string;
  musicTracksJson: string;
  galleryPhotosJson: string;
};

type TaxonomyFormState = {
  name: string;
  type: TaxonomyPayload['type'];
  kind: 'category' | 'tag';
};

const adminTabs: Array<{ key: AdminTab; label: string; hint: string }> = [
  { key: 'dashboard', label: '仪表盘', hint: '总览' },
  { key: 'articles', label: '文章', hint: 'Markdown' },
  { key: 'projects', label: '项目', hint: '作品集' },
  { key: 'friends', label: '友链', hint: '朋友墙' },
  { key: 'shares', label: '分享', hint: '资源卡' },
  { key: 'media', label: '媒体库', hint: '图片音乐' },
  { key: 'taxonomy', label: '分类标签', hint: '自动归类' },
  { key: 'analytics', label: '统计', hint: '30 天' },
  { key: 'site', label: '站点', hint: '个人配置' },
  { key: 'password', label: '密码', hint: '安全' },
];

const emptySiteForm: SiteFormState = {
  profileName: '',
  avatarUrl: '',
  headingAccent: '',
  homeStatus: '',
  github: '',
  email: '',
  musicTracksJson: '[]',
  galleryPhotosJson: '[]',
};

const emptyTaxonomyForm: TaxonomyFormState = {
  name: '',
  type: 'article',
  kind: 'category',
};

function updateFormField<T, K extends keyof T>(setForm: Dispatch<SetStateAction<T>>, key: K, value: T[K]) {
  setForm((current) => ({ ...current, [key]: value }));
}

function formatDate(value: string | null | undefined) {
  if (!value) return '未设置';
  return value.slice(0, 10);
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { draft: '草稿', published: '发布', offline: '下架', archived: '归档' };
  return <span className={`admin-status admin-status-${status}`}>{labels[status] ?? status}</span>;
}

function errorText(error: unknown) {
  if (error instanceof ApiError) {
    return typeof error.detail === 'string' ? error.detail : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '操作失败，请稍后再试';
}

function readFlatConfig(configs: Record<string, unknown>, key: string) {
  const value = configs[key];
  return typeof value === 'string' ? value : '';
}

function readJsonConfig(configs: Record<string, unknown>, key: string, fallback = '[]') {
  const value = configs[key];
  if (typeof value === 'string') {
    return value || fallback;
  }

  if (value === undefined) {
    return fallback;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return fallback;
  }
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${value} B`;
}

function parseJsonField(value: string) {
  try {
    return JSON.parse(value || '[]') as unknown;
  } catch {
    throw new Error('JSON 格式不正确，请检查音乐列表或相册图片配置');
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function LoginPanel({ onLogin }: { onLogin: (profile: AdminProfile) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const response = await adminLogin(username, password);
      onLogin(response.admin);
    } catch (error) {
      setMessage({ type: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-canvas admin-auth-canvas">
      <section className="admin-auth-card">
        <p className="admin-eyebrow">Xiyu Wiki Admin</p>
        <h1>欢迎回来</h1>
        <p>登录后就可以维护文章、项目、友链、分享和首页内容。</p>
        <form className="admin-form" onSubmit={handleSubmit}>
          <Field label="用户名">
            <input value={username} onChange={(event) => setUsername(event.currentTarget.value)} autoComplete="username" />
          </Field>
          <Field label="密码">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              autoComplete="current-password"
            />
          </Field>
          {message && <p className={`admin-message admin-message-${message.type}`}>{message.text}</p>}
          <button className="admin-primary-button" type="submit" disabled={busy}>
            {busy ? '登录中...' : '进入后台'}
          </button>
        </form>
        <a className="admin-soft-link" href="/">返回首页</a>
      </section>
    </main>
  );
}

function PasswordPanel({
  title = '首次登录需要修改密码',
  onChanged,
}: {
  title?: string;
  onChanged: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      await changeAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setMessage({ type: 'success', text: '密码已更新' });
      onChanged();
    } catch (error) {
      setMessage({ type: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-panel-grid">
      <article className="admin-card admin-form-card">
        <p className="admin-eyebrow">Security</p>
        <h2>{title}</h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <Field label="当前密码">
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.currentTarget.value)}
              autoComplete="current-password"
            />
          </Field>
          <Field label="新密码">
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.currentTarget.value)}
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
          {message && <p className={`admin-message admin-message-${message.type}`}>{message.text}</p>}
          <button className="admin-primary-button" type="submit" disabled={busy}>
            {busy ? '保存中...' : '保存新密码'}
          </button>
        </form>
      </article>
    </section>
  );
}

function AdminApp() {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [route, setRoute] = useState(() => parseAdminRoute());
  const [contentDirty, setContentDirty] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [friends, setFriends] = useState<ApiFriendLink[]>([]);
  const [shares, setShares] = useState<ApiShare[]>([]);
  const [mediaFiles, setMediaFiles] = useState<UploadedFile[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [tags, setTags] = useState<ApiTag[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [siteForm, setSiteForm] = useState<SiteFormState>(emptySiteForm);
  const [taxonomyForm, setTaxonomyForm] = useState<TaxonomyFormState>(emptyTaxonomyForm);
  const activeTab = route.section;

  const navigateAdmin = useCallback((path: string, force = false) => {
    if (!force && contentDirty && !window.confirm('当前内容有未保存修改，确认离开吗？')) return;
    window.history.pushState({}, '', path);
    setRoute(parseAdminRoute(path));
  }, [contentDirty]);

  useEffect(() => {
    const currentPath = window.location.pathname;
    const handlePopState = () => {
      if (contentDirty && !window.confirm('当前内容有未保存修改，确认离开吗？')) {
        window.history.pushState({}, '', currentPath);
        return;
      }
      setRoute(parseAdminRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [contentDirty, route]);

  const loadData = useCallback(async () => {
    setBusy(true);
    try {
      const [dashboardData, articleData, projectData, friendData, shareData, siteData, uploadData, categoryData, tagData, analyticsData] = await Promise.all([
        getDashboard(),
        listAdminArticles(),
        listAdminProjects(),
        listAdminFriendLinks(),
        listAdminShares(),
        getSiteConfig(),
        listUploads(),
        listCategories(),
        listTags(),
        getAdminAnalytics(30),
      ]);
      setDashboard(dashboardData);
      setArticles(articleData);
      setProjects(projectData);
      setFriends(friendData);
      setShares(shareData);
      setMediaFiles(uploadData);
      setCategories(categoryData);
      setTags(tagData);
      setAnalytics(analyticsData);
      setSiteForm({
        profileName: readFlatConfig(siteData.configs, 'profile.name'),
        avatarUrl: readFlatConfig(siteData.configs, 'profile.avatarUrl'),
        headingAccent: readFlatConfig(siteData.configs, 'hero.headingAccent'),
        homeStatus: readFlatConfig(siteData.configs, 'home.status'),
        github: readFlatConfig(siteData.configs, 'contact.github'),
        email: readFlatConfig(siteData.configs, 'contact.email'),
        musicTracksJson: readJsonConfig(siteData.configs, 'home.musicTracks'),
        galleryPhotosJson: readJsonConfig(siteData.configs, 'home.galleryPhotos'),
      });
    } catch (error) {
      setMessage({ type: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    getCurrentAdmin()
      .then((profile) => setAdmin(profile))
      .catch(() => setAdmin(null))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (admin && !admin.must_change_password) {
      const timer = window.setTimeout(() => {
        void loadData();
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [admin, loadData]);

  const handleLogout = async () => {
    if (contentDirty && !window.confirm('当前内容有未保存修改，确认退出后台吗？')) return;
    await adminLogout();
    setAdmin(null);
  };

  const handlePasswordReady = () => {
    setAdmin((current) => current ? { ...current, must_change_password: false } : current);
    navigateAdmin('/admin', true);
  };

  const runAction = async (successText: string, action: () => Promise<unknown>) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await loadData();
      setMessage({ type: 'success', text: successText });
    } catch (error) {
      setMessage({ type: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (
    file: File,
    ownerType: string,
    callback: (url: string) => void,
    ownerId?: string,
    articleSlug?: string,
  ) => {
    setBusy(true);
    try {
      const uploaded = await uploadAdminImage(file, ownerType, ownerId, articleSlug);
      callback(uploaded.url);
      setMediaFiles((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)]);
      setMessage({ type: 'success', text: '图片已上传' });
      return uploaded.url;
    } catch (error) {
      setMessage({ type: 'error', text: errorText(error) });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleSiteSubmit = (event: FormEvent) => {
    event.preventDefault();
    void runAction('站点配置已保存', async () => {
      await updateSiteConfig({
        'profile.name': siteForm.profileName,
        'profile.avatarUrl': siteForm.avatarUrl,
        'hero.headingAccent': siteForm.headingAccent,
        'home.status': siteForm.homeStatus,
        'contact.github': siteForm.github,
        'contact.email': siteForm.email,
        'home.musicTracks': parseJsonField(siteForm.musicTracksJson),
        'home.galleryPhotos': parseJsonField(siteForm.galleryPhotosJson),
      });
    });
  };

  const handleTaxonomySubmit = (event: FormEvent) => {
    event.preventDefault();
    void runAction(taxonomyForm.kind === 'category' ? '分类已创建' : '标签已创建', async () => {
      if (taxonomyForm.kind === 'category') {
        await createCategory({ name: taxonomyForm.name, type: taxonomyForm.type, sort_order: 0 });
      } else {
        await createTag({ name: taxonomyForm.name, type: taxonomyForm.type });
      }
      setTaxonomyForm(emptyTaxonomyForm);
    });
  };

  const handleMediaUpload = (file: File, ownerType: string) => {
    void runAction('媒体已上传', async () => {
      const uploaded = await uploadAdminFile(file, ownerType);
      setMediaFiles((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)]);
    });
  };

  const handleMediaDelete = (file: UploadedFile) => {
    if (!window.confirm(`确认删除 ${file.original_name} 吗？`)) return;
    void runAction('媒体已删除', () => deleteUpload(file.id));
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => setMessage({ type: 'success', text: 'URL 已复制' }))
      .catch(() => setMessage({ type: 'error', text: '复制失败，请手动复制 URL' }));
  };

  const handleInsertMediaToArticle = (file: UploadedFile) => {
    const snippet = file.mime_type.startsWith('audio/')
      ? `<audio controls src="${file.url}"></audio>`
      : `![${file.original_name}](${file.url})`;
    window.sessionStorage.setItem('admin.pendingArticleSnippet', snippet);
    navigateAdmin('/admin/articles/new');
  };

  const handleArchive = (resourceType: string, id: string) => {
    void runAction('已归档', () => archiveItem(resourceType, id));
  };

  const handleRestore = (resourceType: string, id: string) => {
    void runAction('已恢复为草稿', () => restoreItem(resourceType, id, 'draft'));
  };

  const handleDelete = (resourceType: string, id: string) => {
    if (!window.confirm('确认永久删除吗？这个操作不能撤销。')) return;
    void runAction('已永久删除', () => deleteItem(resourceType, id));
  };

  if (authLoading) {
    return (
      <main className="admin-canvas admin-auth-canvas">
        <section className="admin-auth-card">
          <p className="admin-eyebrow">Loading</p>
          <h1>正在检查登录状态...</h1>
        </section>
      </main>
    );
  }

  if (!admin) {
    return <LoginPanel onLogin={setAdmin} />;
  }

  if (admin.must_change_password) {
    return (
      <main className="admin-canvas admin-auth-canvas">
        <div className="admin-soft-glow admin-glow-pink" />
        <div className="admin-soft-glow admin-glow-blue" />
        <PasswordPanel onChanged={handlePasswordReady} />
      </main>
    );
  }

  return (
    <main className="admin-canvas">
      <div className="admin-soft-glow admin-glow-pink" />
      <div className="admin-soft-glow admin-glow-blue" />
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">羽</span>
          <div>
            <p className="admin-eyebrow">Pink Blue Wiki</p>
            <h1>后台管理</h1>
          </div>
        </div>
        <nav className="admin-tabs">
          {adminTabs.map((tab) => (
            <button
              type="button"
              className={activeTab === tab.key ? 'active' : undefined}
              onClick={() => navigateAdmin(adminSectionPath(tab.key))}
              key={tab.key}
            >
              <span>{tab.label}</span>
              <small>{tab.hint}</small>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <span>{admin.username}</span>
          <button type="button" onClick={handleLogout}>退出</button>
          <a href="/">回到首页</a>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">Admin Workspace</p>
            <h2>{adminTabs.find((tab) => tab.key === activeTab)?.label}</h2>
          </div>
          <button type="button" className="admin-ghost-button" onClick={() => void loadData()} disabled={busy}>
            {busy ? '同步中...' : '刷新数据'}
          </button>
        </header>
        {message && <p className={`admin-message admin-message-${message.type}`}>{message.text}</p>}

        {activeTab === 'dashboard' && (
          <DashboardView dashboard={dashboard} />
        )}
        {(['articles', 'projects', 'friends', 'shares'] as AdminTab[]).includes(activeTab) && (
          <ContentWorkspace
            route={route}
            articles={articles}
            projects={projects}
            friends={friends}
            shares={shares}
            categories={categories}
            tags={tags}
            mediaFiles={mediaFiles}
            busy={busy}
            onNavigate={navigateAdmin}
            onDirtyChange={setContentDirty}
            onReload={loadData}
            onMessage={setMessage}
            onUploadImage={(file, ownerType, ownerId, articleSlug) => handleUpload(file, ownerType, () => undefined, ownerId, articleSlug)}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        )}
        {activeTab === 'media' && (
          <MediaLibraryView
            files={mediaFiles}
            onUpload={handleMediaUpload}
            onCopyUrl={handleCopyUrl}
            onInsertToArticle={handleInsertMediaToArticle}
            onDelete={handleMediaDelete}
          />
        )}
        {activeTab === 'taxonomy' && (
          <TaxonomyView
            categories={categories}
            tags={tags}
            form={taxonomyForm}
            setForm={setTaxonomyForm}
            onSubmit={handleTaxonomySubmit}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsView analytics={analytics} />
        )}
        {activeTab === 'site' && (
          <SiteConfigView
            form={siteForm}
            setForm={setSiteForm}
            onSubmit={handleSiteSubmit}
            onAvatarUpload={(file) => void handleUpload(file, 'site_config', (url) => setSiteForm((current) => ({ ...current, avatarUrl: url })))}
          />
        )}
        {activeTab === 'password' && (
          <PasswordPanel title="修改后台密码" onChanged={() => setMessage({ type: 'success', text: '密码已更新' })} />
        )}
      </section>
    </main>
  );
}

function DashboardView({ dashboard }: { dashboard: DashboardData | null }) {
  const metrics = useMemo(() => [
    { label: '文章', value: dashboard?.article_count ?? 0 },
    { label: '项目', value: dashboard?.project_count ?? 0 },
    { label: '友链', value: dashboard?.friend_link_count ?? 0 },
    { label: '分享', value: dashboard?.share_count ?? 0 },
    { label: '浏览量', value: dashboard?.total_view_count ?? 0 },
    { label: '草稿', value: dashboard?.draft_count ?? 0 },
    { label: '已发布', value: dashboard?.published_count ?? 0 },
  ], [dashboard]);

  return (
    <section className="admin-panel-grid">
      <div className="admin-metric-grid">
        {metrics.map((metric) => (
          <article className="admin-card admin-metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>
      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="admin-eyebrow">Recent</p>
            <h2>最近更新</h2>
          </div>
        </div>
        <div className="admin-list">
          {(dashboard?.recent_updates ?? []).map((item) => (
            <div className="admin-list-row" key={`${item.type}-${item.id}`}>
              <div>
                <strong>{item.title}</strong>
                <small>{item.type} · {formatDate(item.updated_at)}</small>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
          {dashboard?.recent_updates.length === 0 && <p className="admin-empty">还没有更新记录。</p>}
        </div>
      </article>
    </section>
  );
}

function MediaLibraryView({
  files,
  onUpload,
  onCopyUrl,
  onInsertToArticle,
  onDelete,
}: {
  files: UploadedFile[];
  onUpload: (file: File, ownerType: string) => void;
  onCopyUrl: (url: string) => void;
  onInsertToArticle: (file: UploadedFile) => void;
  onDelete: (file: UploadedFile) => void;
}) {
  const [query, setQuery] = useState('');
  const [ownerType, setOwnerType] = useState('全部');
  const filteredFiles = files.filter((file) => {
    const matchesType = ownerType === '全部' || file.owner_type === ownerType;
    const source = `${file.original_name} ${file.url} ${file.mime_type}`.toLowerCase();
    return matchesType && source.includes(query.trim().toLowerCase());
  });

  return (
    <section className="admin-panel-grid">
      <article className="admin-card">
        <div className="admin-card-head">
          <div><p className="admin-eyebrow">Media Library</p><h2>媒体库</h2></div>
          <div className="admin-form-actions">
            <label className="admin-secondary-file">
              上传图片
              <input type="file" accept="image/*" onChange={(event) => event.currentTarget.files?.[0] && onUpload(event.currentTarget.files[0], 'gallery')} />
            </label>
            <label className="admin-secondary-file">
              上传音乐
              <input type="file" accept="audio/*" onChange={(event) => event.currentTarget.files?.[0] && onUpload(event.currentTarget.files[0], 'music')} />
            </label>
          </div>
        </div>
        <div className="admin-filter-row">
          <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="搜索文件名、URL 或类型" />
          <select value={ownerType} onChange={(event) => setOwnerType(event.currentTarget.value)}>
            {['全部', 'article', 'project', 'share', 'friend_link', 'gallery', 'music', 'misc'].map((item) => (
              <option value={item} key={item}>{item}</option>
            ))}
          </select>
        </div>
      </article>
      <div className="admin-media-grid">
        {filteredFiles.map((file) => (
          <article className="admin-card admin-media-card" key={file.id}>
            <div className="admin-media-thumb">
              {file.mime_type.startsWith('image/') ? (
                <img src={file.url} alt={file.original_name} />
              ) : (
                <audio controls src={file.url} />
              )}
            </div>
            <div>
              <strong>{file.original_name}</strong>
              <small>{formatBytes(file.size_bytes)} · {file.owner_type ?? '未归类'} · {formatDate(file.created_at)}</small>
              <span className={file.is_used ? 'admin-usage-badge used' : 'admin-usage-badge'}>
                {file.is_used ? '使用中' : '未使用'}
              </span>
              <code>{file.url}</code>
            </div>
            <div className="admin-row-actions">
              <button type="button" onClick={() => onCopyUrl(file.url)}>复制 URL</button>
              <button type="button" onClick={() => onInsertToArticle(file)}>插入文章</button>
              {!file.is_used && <button type="button" className="danger" onClick={() => onDelete(file)}>删除未使用</button>}
            </div>
          </article>
        ))}
        {filteredFiles.length === 0 && <p className="admin-empty">还没有媒体文件。</p>}
      </div>
    </section>
  );
}

function TaxonomyView({
  categories,
  tags,
  form,
  setForm,
  onSubmit,
}: {
  categories: ApiCategory[];
  tags: ApiTag[];
  form: TaxonomyFormState;
  setForm: React.Dispatch<React.SetStateAction<TaxonomyFormState>>;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section className="admin-work-grid">
      <article className="admin-card admin-form-card">
        <div className="admin-card-head">
          <div><p className="admin-eyebrow">Taxonomy</p><h2>新增分类 / 标签</h2></div>
        </div>
        <form className="admin-form" onSubmit={onSubmit}>
          <Field label="名称"><input required value={form.name} onChange={(event) => updateFormField(setForm, 'name', event.currentTarget.value)} /></Field>
          <div className="admin-two-col">
            <Field label="内容类型">
              <select value={form.type} onChange={(event) => updateFormField(setForm, 'type', event.currentTarget.value as TaxonomyPayload['type'])}>
                <option value="article">文章</option>
                <option value="share">分享</option>
                <option value="project">项目</option>
              </select>
            </Field>
            <Field label="创建类型">
              <select value={form.kind} onChange={(event) => updateFormField(setForm, 'kind', event.currentTarget.value as TaxonomyFormState['kind'])}>
                <option value="category">分类</option>
                <option value="tag">标签</option>
              </select>
            </Field>
          </div>
          <button className="admin-primary-button" type="submit">创建</button>
        </form>
      </article>
      <article className="admin-card">
        <div className="admin-card-head">
          <div><p className="admin-eyebrow">Current</p><h2>已有分类和标签</h2></div>
        </div>
        <div className="admin-taxonomy-grid">
          <section>
            <h3>分类</h3>
            <div className="admin-chip-cloud">
              {categories.map((category) => <span key={category.id}>{category.name} · {category.type}</span>)}
            </div>
          </section>
          <section>
            <h3>标签</h3>
            <div className="admin-chip-cloud">
              {tags.map((tag) => <span key={tag.id}>{tag.name} · {tag.type}</span>)}
            </div>
          </section>
        </div>
      </article>
    </section>
  );
}

function AnalyticsView({ analytics }: { analytics: AnalyticsData | null }) {
  const metrics = [
    { label: 'PV', value: analytics?.total_page_views ?? 0 },
    { label: 'UV', value: analytics?.unique_visitors ?? 0 },
    { label: '文章点赞', value: analytics?.article_like_count ?? 0 },
    { label: '网站点赞', value: analytics?.site_like_count ?? 0 },
    { label: '外链点击', value: analytics?.outbound_click_count ?? 0 },
  ];
  const maxViews = Math.max(1, ...(analytics?.daily.map((item) => item.page_views) ?? [1]));

  return (
    <section className="admin-panel-grid">
      <div className="admin-metric-grid">
        {metrics.map((metric) => (
          <article className="admin-card admin-metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>
      <article className="admin-card">
        <div className="admin-card-head">
          <div><p className="admin-eyebrow">Trend</p><h2>最近 30 天</h2></div>
        </div>
        <div className="admin-trend-bars">
          {(analytics?.daily ?? []).map((day) => (
            <span title={`${day.date} · ${day.page_views} PV`} style={{ '--bar-h': `${Math.max(8, (day.page_views / maxViews) * 100)}%` } as React.CSSProperties} key={day.date}>
              <i />
            </span>
          ))}
          {(analytics?.daily.length ?? 0) === 0 && <p className="admin-empty">还没有访问趋势。</p>}
        </div>
      </article>
      <div className="admin-analytics-grid">
        <AdminTopList title="热门文章" rows={(analytics?.top_articles ?? []).map((item) => ({ title: item.title, meta: `${item.views} 浏览 · ${item.likes} 赞` }))} />
        <AdminTopList title="热门分享" rows={(analytics?.top_shares ?? []).map((item) => ({ title: item.title, meta: `${item.clicks} 点击` }))} />
        <AdminTopList title="热门项目" rows={(analytics?.top_projects ?? []).map((item) => ({ title: item.title, meta: `${item.clicks} 点击` }))} />
        <AdminTopList title="来源" rows={(analytics?.top_referrers ?? []).map((item) => ({ title: item.referrer, meta: `${item.count} 次` }))} />
      </div>
    </section>
  );
}

function AdminTopList({ title, rows }: { title: string; rows: Array<{ title: string; meta: string }> }) {
  return (
    <article className="admin-card">
      <div className="admin-card-head">
        <div><p className="admin-eyebrow">Rank</p><h2>{title}</h2></div>
      </div>
      <div className="admin-list">
        {rows.map((row) => (
          <div className="admin-list-row" key={`${row.title}-${row.meta}`}>
            <div>
              <strong>{row.title}</strong>
              <small>{row.meta}</small>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="admin-empty">暂无数据。</p>}
      </div>
    </article>
  );
}

function SiteConfigView({
  form,
  setForm,
  onSubmit,
  onAvatarUpload,
}: {
  form: SiteFormState;
  setForm: React.Dispatch<React.SetStateAction<SiteFormState>>;
  onSubmit: (event: FormEvent) => void;
  onAvatarUpload: (file: File) => void;
}) {
  const handleAvatarDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith('image/'));
    if (file) {
      onAvatarUpload(file);
    }
  };

  return (
    <section className="admin-panel-grid">
      <article className="admin-card admin-form-card">
        <div className="admin-card-head">
          <div><p className="admin-eyebrow">Site Config</p><h2>站点配置</h2></div>
        </div>
        <form className="admin-form" onSubmit={onSubmit}>
          <Field label="站点名"><input value={form.profileName} onChange={(event) => updateFormField(setForm, 'profileName', event.currentTarget.value)} /></Field>
          <Field label="头像 URL"><input value={form.avatarUrl} onChange={(event) => updateFormField(setForm, 'avatarUrl', event.currentTarget.value)} /></Field>
          <label className="admin-file-field">
            <span>上传头像</span>
            <input type="file" accept="image/*" onChange={(event) => event.currentTarget.files?.[0] && onAvatarUpload(event.currentTarget.files[0])} />
          </label>
          <Field label="首页昵称"><input value={form.headingAccent} onChange={(event) => updateFormField(setForm, 'headingAccent', event.currentTarget.value)} /></Field>
          <Field label="首页状态"><input value={form.homeStatus} onChange={(event) => updateFormField(setForm, 'homeStatus', event.currentTarget.value)} /></Field>
          <div className="admin-two-col">
            <Field label="GitHub"><input value={form.github} onChange={(event) => updateFormField(setForm, 'github', event.currentTarget.value)} /></Field>
            <Field label="Email"><input value={form.email} onChange={(event) => updateFormField(setForm, 'email', event.currentTarget.value)} /></Field>
          </div>
          <Field label="音乐列表 JSON">
            <textarea value={form.musicTracksJson} onChange={(event) => updateFormField(setForm, 'musicTracksJson', event.currentTarget.value)} rows={7} />
          </Field>
          <Field label="相册图片 JSON">
            <textarea value={form.galleryPhotosJson} onChange={(event) => updateFormField(setForm, 'galleryPhotosJson', event.currentTarget.value)} rows={7} />
          </Field>
          <button className="admin-primary-button" type="submit">保存配置</button>
        </form>
      </article>
      <article
        className="admin-card admin-preview-card admin-avatar-drop-card"
        onDrop={handleAvatarDrop}
        onDragOver={(event) => event.preventDefault()}
      >
        <p className="admin-eyebrow">Preview</p>
        {form.avatarUrl && <img src={form.avatarUrl} alt="" />}
        <h2>{form.headingAccent || '辛熙羽'}</h2>
        <p>{form.homeStatus || '正在整理灵感与作品'}</p>
        <small>可把头像图片拖到这里上传</small>
      </article>
    </section>
  );
}

export default AdminApp;
