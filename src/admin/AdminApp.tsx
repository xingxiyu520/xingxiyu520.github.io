import { useCallback, useEffect, useMemo, useState, type ClipboardEvent, type Dispatch, type DragEvent, type FormEvent, type SetStateAction } from 'react';
import { adminLogin, adminLogout, changeAdminPassword, getCurrentAdmin, type AdminProfile } from '../api/admin';
import { ApiError } from '../api/client';
import type { ApiArticle, ApiFriendLink, ApiProject, ApiShare } from '../api/content';
import {
  archiveItem,
  createArticle,
  createFriendLink,
  createProject,
  createShare,
  deleteItem,
  getDashboard,
  getSiteConfig,
  importMarkdownArticle,
  listAdminArticles,
  listAdminFriendLinks,
  listAdminProjects,
  listAdminShares,
  restoreItem,
  updateArticle,
  updateFriendLink,
  updateProject,
  updateShare,
  updateSiteConfig,
  uploadAdminImage,
  type ArticlePayload,
  type ContentStatus,
  type DashboardData,
  type FriendLinkPayload,
  type ProjectPayload,
  type SharePayload,
} from '../api/adminContent';
import './AdminApp.css';

type AdminTab = 'dashboard' | 'articles' | 'projects' | 'friends' | 'shares' | 'site' | 'password';

type AdminMessage = {
  type: 'success' | 'error' | 'info';
  text: string;
};

type ArticleFormState = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content_markdown: string;
  cover_url: string;
  category_name: string;
  tag_names: string;
  status: ContentStatus;
  is_pinned: boolean;
  sort_order: number;
};

type ProjectFormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  cover_url: string;
  tech_stack: string;
  github_url: string;
  demo_url: string;
  status: ContentStatus;
  sort_order: number;
};

type FriendFormState = {
  id?: string;
  name: string;
  url: string;
  avatar_url: string;
  description: string;
  is_visible: boolean;
  status: ContentStatus;
  sort_order: number;
};

type ShareFormState = {
  id?: string;
  title: string;
  type: string;
  external_url: string;
  description: string;
  cover_url: string;
  category_name: string;
  tag_names: string;
  status: ContentStatus;
  sort_order: number;
};

type SiteFormState = {
  profileName: string;
  avatarUrl: string;
  headingAccent: string;
  homeStatus: string;
  github: string;
  email: string;
};

const adminTabs: Array<{ key: AdminTab; label: string; hint: string }> = [
  { key: 'dashboard', label: '仪表盘', hint: '总览' },
  { key: 'articles', label: '文章', hint: 'Markdown' },
  { key: 'projects', label: '项目', hint: '作品集' },
  { key: 'friends', label: '友链', hint: '朋友墙' },
  { key: 'shares', label: '分享', hint: '资源卡' },
  { key: 'site', label: '站点', hint: '个人配置' },
  { key: 'password', label: '密码', hint: '安全' },
];

const statusOptions: Array<{ value: ContentStatus; label: string }> = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '发布' },
  { value: 'offline', label: '下架' },
  { value: 'archived', label: '归档' },
];

const emptyArticleForm: ArticleFormState = {
  title: '',
  slug: '',
  summary: '',
  content_markdown: '',
  cover_url: '',
  category_name: '默认',
  tag_names: '',
  status: 'draft',
  is_pinned: false,
  sort_order: 0,
};

const emptyProjectForm: ProjectFormState = {
  name: '',
  slug: '',
  description: '',
  cover_url: '',
  tech_stack: '',
  github_url: '',
  demo_url: '',
  status: 'draft',
  sort_order: 0,
};

const emptyFriendForm: FriendFormState = {
  name: '',
  url: '',
  avatar_url: '',
  description: '',
  is_visible: true,
  status: 'published',
  sort_order: 0,
};

const emptyShareForm: ShareFormState = {
  title: '',
  type: '工具',
  external_url: '',
  description: '',
  cover_url: '',
  category_name: '默认',
  tag_names: '',
  status: 'draft',
  sort_order: 0,
};

const emptySiteForm: SiteFormState = {
  profileName: '',
  avatarUrl: '',
  headingAccent: '',
  homeStatus: '',
  github: '',
  email: '',
};

function splitCommaList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function updateFormField<T, K extends keyof T>(setForm: Dispatch<SetStateAction<T>>, key: K, value: T[K]) {
  setForm((current) => ({ ...current, [key]: value }));
}

function formatDate(value: string | null | undefined) {
  if (!value) return '未设置';
  return value.slice(0, 10);
}

function statusLabel(value: string) {
  return statusOptions.find((item) => item.value === value)?.label ?? value;
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

function articleToForm(article: ApiArticle): ArticleFormState {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    summary: article.summary ?? '',
    content_markdown: article.content_markdown ?? '',
    cover_url: article.cover_url ?? '',
    category_name: article.category.name,
    tag_names: article.tags.map((tag) => tag.name).join(', '),
    status: article.status as ContentStatus,
    is_pinned: article.is_pinned,
    sort_order: article.sort_order,
  };
}

function projectToForm(project: ApiProject): ProjectFormState {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description ?? '',
    cover_url: project.cover_url ?? '',
    tech_stack: project.tech_stack.join(', '),
    github_url: project.github_url ?? '',
    demo_url: project.demo_url ?? '',
    status: project.status as ContentStatus,
    sort_order: project.sort_order,
  };
}

function friendToForm(friend: ApiFriendLink): FriendFormState {
  return {
    id: friend.id,
    name: friend.name,
    url: friend.url,
    avatar_url: friend.avatar_url ?? '',
    description: friend.description ?? '',
    is_visible: friend.is_visible,
    status: friend.status as ContentStatus,
    sort_order: friend.sort_order,
  };
}

function shareToForm(share: ApiShare): ShareFormState {
  return {
    id: share.id,
    title: share.title,
    type: share.type,
    external_url: share.external_url,
    description: share.description ?? '',
    cover_url: share.cover_url ?? '',
    category_name: share.category.name,
    tag_names: share.tags.map((tag) => tag.name).join(', '),
    status: share.status as ContentStatus,
    sort_order: share.sort_order,
  };
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`admin-status admin-status-${status}`}>{statusLabel(status)}</span>;
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
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [authLoading, setAuthLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [friends, setFriends] = useState<ApiFriendLink[]>([]);
  const [shares, setShares] = useState<ApiShare[]>([]);
  const [articleForm, setArticleForm] = useState<ArticleFormState>(emptyArticleForm);
  const [projectForm, setProjectForm] = useState<ProjectFormState>(emptyProjectForm);
  const [friendForm, setFriendForm] = useState<FriendFormState>(emptyFriendForm);
  const [shareForm, setShareForm] = useState<ShareFormState>(emptyShareForm);
  const [siteForm, setSiteForm] = useState<SiteFormState>(emptySiteForm);

  const loadData = useCallback(async () => {
    setBusy(true);
    try {
      const [dashboardData, articleData, projectData, friendData, shareData, siteData] = await Promise.all([
        getDashboard(),
        listAdminArticles(),
        listAdminProjects(),
        listAdminFriendLinks(),
        listAdminShares(),
        getSiteConfig(),
      ]);
      setDashboard(dashboardData);
      setArticles(articleData);
      setProjects(projectData);
      setFriends(friendData);
      setShares(shareData);
      setSiteForm({
        profileName: readFlatConfig(siteData.configs, 'profile.name'),
        avatarUrl: readFlatConfig(siteData.configs, 'profile.avatarUrl'),
        headingAccent: readFlatConfig(siteData.configs, 'hero.headingAccent'),
        homeStatus: readFlatConfig(siteData.configs, 'home.status'),
        github: readFlatConfig(siteData.configs, 'contact.github'),
        email: readFlatConfig(siteData.configs, 'contact.email'),
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
      void loadData();
    }
  }, [admin, loadData]);

  const handleLogout = async () => {
    await adminLogout();
    setAdmin(null);
  };

  const handlePasswordReady = () => {
    setAdmin((current) => current ? { ...current, must_change_password: false } : current);
    setActiveTab('dashboard');
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
      setMessage({ type: 'success', text: '图片已上传' });
    } catch (error) {
      setMessage({ type: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  };

  const insertMarkdownImages = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setBusy(true);
    try {
      const snippets: string[] = [];
      for (const file of imageFiles) {
        const uploaded = await uploadAdminImage(file, 'article', articleForm.id, articleForm.slug || articleForm.title);
        snippets.push(`![${file.name}](${uploaded.url})`);
      }
      setArticleForm((current) => ({
        ...current,
        content_markdown: `${current.content_markdown.trimEnd()}\n\n${snippets.join('\n')}\n`,
      }));
      setMessage({ type: 'success', text: '图片已插入 Markdown' });
    } catch (error) {
      setMessage({ type: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleArticleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload: ArticlePayload = {
      title: articleForm.title,
      slug: articleForm.slug || undefined,
      summary: articleForm.summary || undefined,
      content_markdown: articleForm.content_markdown,
      cover_url: articleForm.cover_url || undefined,
      category_name: articleForm.category_name || '默认',
      tag_names: splitCommaList(articleForm.tag_names),
      status: articleForm.status,
      is_pinned: articleForm.is_pinned,
      sort_order: articleForm.sort_order,
    };

    void runAction(articleForm.id ? '文章已更新' : '文章已创建', async () => {
      if (articleForm.id) {
        await updateArticle(articleForm.id, payload);
      } else {
        await createArticle(payload);
      }
      setArticleForm(emptyArticleForm);
    });
  };

  const handleProjectSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload: ProjectPayload = {
      name: projectForm.name,
      slug: projectForm.slug || undefined,
      description: projectForm.description || undefined,
      cover_url: projectForm.cover_url || undefined,
      tech_stack: splitCommaList(projectForm.tech_stack),
      github_url: projectForm.github_url || undefined,
      demo_url: projectForm.demo_url || undefined,
      status: projectForm.status,
      sort_order: projectForm.sort_order,
    };

    void runAction(projectForm.id ? '项目已更新' : '项目已创建', async () => {
      if (projectForm.id) {
        await updateProject(projectForm.id, payload);
      } else {
        await createProject(payload);
      }
      setProjectForm(emptyProjectForm);
    });
  };

  const handleFriendSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload: FriendLinkPayload = {
      name: friendForm.name,
      url: friendForm.url,
      avatar_url: friendForm.avatar_url || undefined,
      description: friendForm.description || undefined,
      is_visible: friendForm.is_visible,
      status: friendForm.status,
      sort_order: friendForm.sort_order,
    };

    void runAction(friendForm.id ? '友链已更新' : '友链已创建', async () => {
      if (friendForm.id) {
        await updateFriendLink(friendForm.id, payload);
      } else {
        await createFriendLink(payload);
      }
      setFriendForm(emptyFriendForm);
    });
  };

  const handleShareSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload: SharePayload = {
      title: shareForm.title,
      type: shareForm.type,
      external_url: shareForm.external_url,
      description: shareForm.description || undefined,
      cover_url: shareForm.cover_url || undefined,
      category_name: shareForm.category_name || '默认',
      tag_names: splitCommaList(shareForm.tag_names),
      status: shareForm.status,
      sort_order: shareForm.sort_order,
    };

    void runAction(shareForm.id ? '分享已更新' : '分享已创建', async () => {
      if (shareForm.id) {
        await updateShare(shareForm.id, payload);
      } else {
        await createShare(payload);
      }
      setShareForm(emptyShareForm);
    });
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
      });
    });
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
              onClick={() => setActiveTab(tab.key)}
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
        {activeTab === 'articles' && (
          <ArticlesView
            articles={articles}
            form={articleForm}
            setForm={setArticleForm}
            onSubmit={handleArticleSubmit}
            onImport={(file) => void runAction('Markdown 已导入', async () => {
              const imported = await importMarkdownArticle(file, articleForm.category_name || '默认');
              setArticleForm(articleToForm(imported));
            })}
            onCoverUpload={(file) => void handleUpload(file, 'article', (url) => setArticleForm((current) => ({ ...current, cover_url: url })), articleForm.id, articleForm.slug || articleForm.title)}
            onInsertMarkdownImages={insertMarkdownImages}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        )}
        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            form={projectForm}
            setForm={setProjectForm}
            onSubmit={handleProjectSubmit}
            onCoverUpload={(file) => void handleUpload(file, 'project', (url) => setProjectForm((current) => ({ ...current, cover_url: url })), projectForm.id)}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        )}
        {activeTab === 'friends' && (
          <FriendsView
            friends={friends}
            form={friendForm}
            setForm={setFriendForm}
            onSubmit={handleFriendSubmit}
            onAvatarUpload={(file) => void handleUpload(file, 'friend_link', (url) => setFriendForm((current) => ({ ...current, avatar_url: url })), friendForm.id)}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        )}
        {activeTab === 'shares' && (
          <SharesView
            shares={shares}
            form={shareForm}
            setForm={setShareForm}
            onSubmit={handleShareSubmit}
            onCoverUpload={(file) => void handleUpload(file, 'share', (url) => setShareForm((current) => ({ ...current, cover_url: url })), shareForm.id)}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        )}
        {activeTab === 'site' && (
          <SiteConfigView form={siteForm} setForm={setSiteForm} onSubmit={handleSiteSubmit} />
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

function ArticlesView({
  articles,
  form,
  setForm,
  onSubmit,
  onImport,
  onCoverUpload,
  onInsertMarkdownImages,
  onArchive,
  onRestore,
  onDelete,
}: {
  articles: ApiArticle[];
  form: ArticleFormState;
  setForm: React.Dispatch<React.SetStateAction<ArticleFormState>>;
  onSubmit: (event: FormEvent) => void;
  onImport: (file: File) => void;
  onCoverUpload: (file: File) => void;
  onInsertMarkdownImages: (files: FileList | File[]) => Promise<void>;
  onArchive: (resourceType: string, id: string) => void;
  onRestore: (resourceType: string, id: string) => void;
  onDelete: (resourceType: string, id: string) => void;
}) {
  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = event.clipboardData.files;
    if (files.length > 0) {
      event.preventDefault();
      void onInsertMarkdownImages(files);
    }
  };

  const handleDrop = (event: DragEvent<HTMLTextAreaElement>) => {
    if (event.dataTransfer.files.length > 0) {
      event.preventDefault();
      void onInsertMarkdownImages(event.dataTransfer.files);
    }
  };

  return (
    <section className="admin-work-grid">
      <article className="admin-card admin-form-card">
        <div className="admin-card-head">
          <div>
            <p className="admin-eyebrow">Article Editor</p>
            <h2>{form.id ? '编辑文章' : '新建文章'}</h2>
          </div>
          <button type="button" className="admin-ghost-button" onClick={() => setForm(emptyArticleForm)}>清空</button>
        </div>
        <form className="admin-form" onSubmit={onSubmit}>
          <Field label="标题"><input required value={form.title} onChange={(event) => updateFormField(setForm, 'title', event.currentTarget.value)} /></Field>
          <Field label="slug"><input value={form.slug} onChange={(event) => updateFormField(setForm, 'slug', event.currentTarget.value)} placeholder="留空自动生成" /></Field>
          <Field label="摘要"><textarea value={form.summary} onChange={(event) => updateFormField(setForm, 'summary', event.currentTarget.value)} rows={3} /></Field>
          <div className="admin-two-col">
            <Field label="分类"><input value={form.category_name} onChange={(event) => updateFormField(setForm, 'category_name', event.currentTarget.value)} /></Field>
            <Field label="标签"><input value={form.tag_names} onChange={(event) => updateFormField(setForm, 'tag_names', event.currentTarget.value)} placeholder="AI, 深度学习" /></Field>
          </div>
          <div className="admin-two-col">
            <Field label="状态">
              <select value={form.status} onChange={(event) => updateFormField(setForm, 'status', event.currentTarget.value as ContentStatus)}>
                {statusOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="排序">
              <input type="number" value={form.sort_order} onChange={(event) => updateFormField(setForm, 'sort_order', Number(event.currentTarget.value))} />
            </Field>
          </div>
          <Field label="封面 URL"><input value={form.cover_url} onChange={(event) => updateFormField(setForm, 'cover_url', event.currentTarget.value)} /></Field>
          <label className="admin-file-field">
            <span>上传封面</span>
            <input type="file" accept="image/*" onChange={(event) => event.currentTarget.files?.[0] && onCoverUpload(event.currentTarget.files[0])} />
          </label>
          <Field label="Markdown 正文">
            <textarea
              className="admin-markdown-editor"
              value={form.content_markdown}
              onChange={(event) => updateFormField(setForm, 'content_markdown', event.currentTarget.value)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(event) => event.preventDefault()}
              rows={14}
              placeholder="支持粘贴/拖拽图片，上传后会自动插入 Markdown 图片语法。"
            />
          </Field>
          <label className="admin-inline-check">
            <input type="checkbox" checked={form.is_pinned} onChange={(event) => updateFormField(setForm, 'is_pinned', event.currentTarget.checked)} />
            置顶文章
          </label>
          <div className="admin-form-actions">
            <button className="admin-primary-button" type="submit">{form.id ? '保存文章' : '创建文章'}</button>
            <label className="admin-secondary-file">
              导入 .md
              <input type="file" accept=".md,text/markdown" onChange={(event) => event.currentTarget.files?.[0] && onImport(event.currentTarget.files[0])} />
            </label>
          </div>
        </form>
      </article>
      <ContentList
        title="文章列表"
        emptyText="还没有文章。"
        items={articles}
        resourceType="articles"
        getTitle={(item) => item.title}
        getMeta={(item) => `${formatDate(item.published_at ?? item.created_at)} · ${item.category.name}`}
        onEdit={(item) => setForm(articleToForm(item))}
        onArchive={onArchive}
        onRestore={onRestore}
        onDelete={onDelete}
      />
    </section>
  );
}

function ProjectsView({
  projects,
  form,
  setForm,
  onSubmit,
  onCoverUpload,
  onArchive,
  onRestore,
  onDelete,
}: {
  projects: ApiProject[];
  form: ProjectFormState;
  setForm: React.Dispatch<React.SetStateAction<ProjectFormState>>;
  onSubmit: (event: FormEvent) => void;
  onCoverUpload: (file: File) => void;
  onArchive: (resourceType: string, id: string) => void;
  onRestore: (resourceType: string, id: string) => void;
  onDelete: (resourceType: string, id: string) => void;
}) {
  return (
    <section className="admin-work-grid">
      <article className="admin-card admin-form-card">
        <div className="admin-card-head">
          <div><p className="admin-eyebrow">Projects</p><h2>{form.id ? '编辑项目' : '新建项目'}</h2></div>
          <button type="button" className="admin-ghost-button" onClick={() => setForm(emptyProjectForm)}>清空</button>
        </div>
        <form className="admin-form" onSubmit={onSubmit}>
          <Field label="项目名"><input required value={form.name} onChange={(event) => updateFormField(setForm, 'name', event.currentTarget.value)} /></Field>
          <Field label="slug"><input value={form.slug} onChange={(event) => updateFormField(setForm, 'slug', event.currentTarget.value)} placeholder="留空自动生成" /></Field>
          <Field label="简介"><textarea value={form.description} onChange={(event) => updateFormField(setForm, 'description', event.currentTarget.value)} rows={4} /></Field>
          <Field label="技术栈"><input value={form.tech_stack} onChange={(event) => updateFormField(setForm, 'tech_stack', event.currentTarget.value)} placeholder="React, TypeScript" /></Field>
          <div className="admin-two-col">
            <Field label="GitHub"><input value={form.github_url} onChange={(event) => updateFormField(setForm, 'github_url', event.currentTarget.value)} /></Field>
            <Field label="演示链接"><input value={form.demo_url} onChange={(event) => updateFormField(setForm, 'demo_url', event.currentTarget.value)} /></Field>
          </div>
          <div className="admin-two-col">
            <Field label="状态"><select value={form.status} onChange={(event) => updateFormField(setForm, 'status', event.currentTarget.value as ContentStatus)}>{statusOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></Field>
            <Field label="排序"><input type="number" value={form.sort_order} onChange={(event) => updateFormField(setForm, 'sort_order', Number(event.currentTarget.value))} /></Field>
          </div>
          <Field label="封面 URL"><input value={form.cover_url} onChange={(event) => updateFormField(setForm, 'cover_url', event.currentTarget.value)} /></Field>
          <label className="admin-file-field"><span>上传封面</span><input type="file" accept="image/*" onChange={(event) => event.currentTarget.files?.[0] && onCoverUpload(event.currentTarget.files[0])} /></label>
          <button className="admin-primary-button" type="submit">{form.id ? '保存项目' : '创建项目'}</button>
        </form>
      </article>
      <ContentList title="项目列表" emptyText="还没有项目。" items={projects} resourceType="projects" getTitle={(item) => item.name} getMeta={(item) => `${item.tech_stack.join(' / ') || '未设置技术栈'} · ${formatDate(item.created_at)}`} onEdit={(item) => setForm(projectToForm(item))} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} />
    </section>
  );
}

function FriendsView({
  friends,
  form,
  setForm,
  onSubmit,
  onAvatarUpload,
  onArchive,
  onRestore,
  onDelete,
}: {
  friends: ApiFriendLink[];
  form: FriendFormState;
  setForm: React.Dispatch<React.SetStateAction<FriendFormState>>;
  onSubmit: (event: FormEvent) => void;
  onAvatarUpload: (file: File) => void;
  onArchive: (resourceType: string, id: string) => void;
  onRestore: (resourceType: string, id: string) => void;
  onDelete: (resourceType: string, id: string) => void;
}) {
  return (
    <section className="admin-work-grid">
      <article className="admin-card admin-form-card">
        <div className="admin-card-head">
          <div><p className="admin-eyebrow">Friend Links</p><h2>{form.id ? '编辑友链' : '新增友链'}</h2></div>
          <button type="button" className="admin-ghost-button" onClick={() => setForm(emptyFriendForm)}>清空</button>
        </div>
        <form className="admin-form" onSubmit={onSubmit}>
          <Field label="站点名"><input required value={form.name} onChange={(event) => updateFormField(setForm, 'name', event.currentTarget.value)} /></Field>
          <Field label="链接"><input required value={form.url} onChange={(event) => updateFormField(setForm, 'url', event.currentTarget.value)} /></Field>
          <Field label="头像 URL"><input value={form.avatar_url} onChange={(event) => updateFormField(setForm, 'avatar_url', event.currentTarget.value)} /></Field>
          <label className="admin-file-field"><span>上传头像</span><input type="file" accept="image/*" onChange={(event) => event.currentTarget.files?.[0] && onAvatarUpload(event.currentTarget.files[0])} /></label>
          <Field label="描述"><textarea value={form.description} onChange={(event) => updateFormField(setForm, 'description', event.currentTarget.value)} rows={4} /></Field>
          <div className="admin-two-col">
            <Field label="状态"><select value={form.status} onChange={(event) => updateFormField(setForm, 'status', event.currentTarget.value as ContentStatus)}>{statusOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></Field>
            <Field label="排序"><input type="number" value={form.sort_order} onChange={(event) => updateFormField(setForm, 'sort_order', Number(event.currentTarget.value))} /></Field>
          </div>
          <label className="admin-inline-check"><input type="checkbox" checked={form.is_visible} onChange={(event) => updateFormField(setForm, 'is_visible', event.currentTarget.checked)} />前台展示</label>
          <button className="admin-primary-button" type="submit">{form.id ? '保存友链' : '创建友链'}</button>
        </form>
      </article>
      <ContentList title="友链列表" emptyText="还没有友链。" items={friends} resourceType="friend-links" getTitle={(item) => item.name} getMeta={(item) => `${item.url} · ${item.is_visible ? '展示' : '隐藏'}`} onEdit={(item) => setForm(friendToForm(item))} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} />
    </section>
  );
}

function SharesView({
  shares,
  form,
  setForm,
  onSubmit,
  onCoverUpload,
  onArchive,
  onRestore,
  onDelete,
}: {
  shares: ApiShare[];
  form: ShareFormState;
  setForm: React.Dispatch<React.SetStateAction<ShareFormState>>;
  onSubmit: (event: FormEvent) => void;
  onCoverUpload: (file: File) => void;
  onArchive: (resourceType: string, id: string) => void;
  onRestore: (resourceType: string, id: string) => void;
  onDelete: (resourceType: string, id: string) => void;
}) {
  return (
    <section className="admin-work-grid">
      <article className="admin-card admin-form-card">
        <div className="admin-card-head">
          <div><p className="admin-eyebrow">Share Shelf</p><h2>{form.id ? '编辑分享' : '新增分享'}</h2></div>
          <button type="button" className="admin-ghost-button" onClick={() => setForm(emptyShareForm)}>清空</button>
        </div>
        <form className="admin-form" onSubmit={onSubmit}>
          <Field label="标题"><input required value={form.title} onChange={(event) => updateFormField(setForm, 'title', event.currentTarget.value)} /></Field>
          <div className="admin-two-col">
            <Field label="类型"><input value={form.type} onChange={(event) => updateFormField(setForm, 'type', event.currentTarget.value)} /></Field>
            <Field label="分类"><input value={form.category_name} onChange={(event) => updateFormField(setForm, 'category_name', event.currentTarget.value)} /></Field>
          </div>
          <Field label="外部链接"><input required value={form.external_url} onChange={(event) => updateFormField(setForm, 'external_url', event.currentTarget.value)} /></Field>
          <Field label="简介"><textarea value={form.description} onChange={(event) => updateFormField(setForm, 'description', event.currentTarget.value)} rows={4} /></Field>
          <Field label="标签"><input value={form.tag_names} onChange={(event) => updateFormField(setForm, 'tag_names', event.currentTarget.value)} placeholder="工具, AI" /></Field>
          <Field label="封面 URL"><input value={form.cover_url} onChange={(event) => updateFormField(setForm, 'cover_url', event.currentTarget.value)} /></Field>
          <label className="admin-file-field"><span>上传封面</span><input type="file" accept="image/*" onChange={(event) => event.currentTarget.files?.[0] && onCoverUpload(event.currentTarget.files[0])} /></label>
          <div className="admin-two-col">
            <Field label="状态"><select value={form.status} onChange={(event) => updateFormField(setForm, 'status', event.currentTarget.value as ContentStatus)}>{statusOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></Field>
            <Field label="排序"><input type="number" value={form.sort_order} onChange={(event) => updateFormField(setForm, 'sort_order', Number(event.currentTarget.value))} /></Field>
          </div>
          <button className="admin-primary-button" type="submit">{form.id ? '保存分享' : '创建分享'}</button>
        </form>
      </article>
      <ContentList title="分享列表" emptyText="还没有分享。" items={shares} resourceType="shares" getTitle={(item) => item.title} getMeta={(item) => `${item.category.name} · ${item.external_url}`} onEdit={(item) => setForm(shareToForm(item))} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} />
    </section>
  );
}

function SiteConfigView({
  form,
  setForm,
  onSubmit,
}: {
  form: SiteFormState;
  setForm: React.Dispatch<React.SetStateAction<SiteFormState>>;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section className="admin-panel-grid">
      <article className="admin-card admin-form-card">
        <div className="admin-card-head">
          <div><p className="admin-eyebrow">Site Config</p><h2>站点配置</h2></div>
        </div>
        <form className="admin-form" onSubmit={onSubmit}>
          <Field label="站点名"><input value={form.profileName} onChange={(event) => updateFormField(setForm, 'profileName', event.currentTarget.value)} /></Field>
          <Field label="头像 URL"><input value={form.avatarUrl} onChange={(event) => updateFormField(setForm, 'avatarUrl', event.currentTarget.value)} /></Field>
          <Field label="首页昵称"><input value={form.headingAccent} onChange={(event) => updateFormField(setForm, 'headingAccent', event.currentTarget.value)} /></Field>
          <Field label="首页状态"><input value={form.homeStatus} onChange={(event) => updateFormField(setForm, 'homeStatus', event.currentTarget.value)} /></Field>
          <div className="admin-two-col">
            <Field label="GitHub"><input value={form.github} onChange={(event) => updateFormField(setForm, 'github', event.currentTarget.value)} /></Field>
            <Field label="Email"><input value={form.email} onChange={(event) => updateFormField(setForm, 'email', event.currentTarget.value)} /></Field>
          </div>
          <button className="admin-primary-button" type="submit">保存配置</button>
        </form>
      </article>
      <article className="admin-card admin-preview-card">
        <p className="admin-eyebrow">Preview</p>
        {form.avatarUrl && <img src={form.avatarUrl} alt="" />}
        <h2>{form.headingAccent || '辛熙羽'}</h2>
        <p>{form.homeStatus || '正在整理灵感与作品'}</p>
      </article>
    </section>
  );
}

function ContentList<T extends { id: string; status: string }>({
  title,
  emptyText,
  items,
  resourceType,
  getTitle,
  getMeta,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  title: string;
  emptyText: string;
  items: T[];
  resourceType: string;
  getTitle: (item: T) => string;
  getMeta: (item: T) => string;
  onEdit: (item: T) => void;
  onArchive: (resourceType: string, id: string) => void;
  onRestore: (resourceType: string, id: string) => void;
  onDelete: (resourceType: string, id: string) => void;
}) {
  return (
    <article className="admin-card admin-list-card">
      <div className="admin-card-head">
        <div><p className="admin-eyebrow">Content</p><h2>{title}</h2></div>
        <span className="admin-count-pill">{items.length}</span>
      </div>
      <div className="admin-list">
        {items.map((item) => (
          <div className="admin-list-row admin-manage-row" key={item.id}>
            <div>
              <strong>{getTitle(item)}</strong>
              <small>{getMeta(item)}</small>
            </div>
            <StatusBadge status={item.status} />
            <div className="admin-row-actions">
              <button type="button" onClick={() => onEdit(item)}>编辑</button>
              {item.status === 'archived' ? (
                <button type="button" onClick={() => onRestore(resourceType, item.id)}>恢复</button>
              ) : (
                <button type="button" onClick={() => onArchive(resourceType, item.id)}>归档</button>
              )}
              <button type="button" className="danger" onClick={() => onDelete(resourceType, item.id)}>删除</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="admin-empty">{emptyText}</p>}
      </div>
    </article>
  );
}

export default AdminApp;
