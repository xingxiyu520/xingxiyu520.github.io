import { useCallback, useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { adminLogin, adminLogout, changeAdminPassword, getCurrentAdmin, type AdminProfile } from '../api/admin';
import { ApiError } from '../api/client';
import type { ApiArticle, ApiCategory, ApiFriendLink, ApiProject, ApiShare, ApiTag } from '../api/content';
import {
  archiveItem,
  createCategory,
  createTag,
  deleteItem,
  getAdminAnalytics,
  getDashboard,
  listCategories,
  listAdminArticles,
  listAdminFriendLinks,
  listAdminProjects,
  listAdminShares,
  listTags,
  listUploads,
  restoreItem,
  uploadAdminImage,
  type AnalyticsData,
  type DashboardData,
  type TaxonomyPayload,
  type UploadedFile,
} from '../api/adminContent';
import { adminSectionPath, parseAdminRoute, type AdminSection } from './adminRoutes';
import { ContentWorkspace } from './content/ContentWorkspace';
import { MediaSiteWorkspace, type MediaSiteNotification } from './MediaSiteWorkspace';
import './AdminApp.css';

type AdminTab = AdminSection;

type AdminMessage = {
  type: 'success' | 'error' | 'info';
  text: string;
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
      const [dashboardData, articleData, projectData, friendData, shareData, uploadData, categoryData, tagData, analyticsData] = await Promise.all([
        getDashboard(),
        listAdminArticles(),
        listAdminProjects(),
        listAdminFriendLinks(),
        listAdminShares(),
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

  const handleInsertMediaToArticle = (snippet: string) => {
    window.sessionStorage.setItem('admin.pendingArticleSnippet', snippet);
    navigateAdmin('/admin/articles/new');
  };

  const handleMediaSiteNotice = useCallback((notice: MediaSiteNotification) => {
    setMessage(notice);
    if (notice.type === 'success') {
      void loadData();
    }
  }, [loadData]);

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
          <MediaSiteWorkspace
            mode="media"
            onNotify={handleMediaSiteNotice}
            onInsertToArticle={(snippet) => handleInsertMediaToArticle(snippet)}
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
          <MediaSiteWorkspace
            mode="site"
            onNotify={handleMediaSiteNotice}
            onDirtyChange={setContentDirty}
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

export default AdminApp;
