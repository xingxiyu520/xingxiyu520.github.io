import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type Dispatch,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type SetStateAction,
} from 'react';
import { marked } from 'marked';
import type { ApiArticle, ApiCategory, ApiFriendLink, ApiProject, ApiShare, ApiTag } from '../../api/content';
import {
  createArticle,
  createFriendLink,
  createProject,
  createShare,
  importMarkdownArticle,
  updateArticle,
  updateFriendLink,
  updateProject,
  updateShare,
  type ContentStatus,
  type UploadedFile,
} from '../../api/adminContent';
import { adminEditorPath, adminSectionPath, type AdminEditorResource, type AdminRoute } from '../adminRoutes';
import './ContentWorkspace.css';

type AdminMessage = { type: 'success' | 'error' | 'info'; text: string };
type SaveIntent = 'return' | 'continue';

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
  content_markdown: string;
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

const emptyArticleForm: ArticleFormState = {
  title: '', slug: '', summary: '', content_markdown: '', cover_url: '', category_name: '默认', tag_names: '', status: 'draft', is_pinned: false, sort_order: 0,
};
const emptyProjectForm: ProjectFormState = {
  name: '', slug: '', description: '', content_markdown: '', cover_url: '', tech_stack: '', github_url: '', demo_url: '', status: 'draft', sort_order: 0,
};
const emptyFriendForm: FriendFormState = {
  name: '', url: '', avatar_url: '', description: '', is_visible: true, status: 'published', sort_order: 0,
};
const emptyShareForm: ShareFormState = {
  title: '', type: '工具', external_url: '', description: '', cover_url: '', category_name: '默认', tag_names: '', status: 'draft', sort_order: 0,
};

const statusOptions: Array<{ value: ContentStatus; label: string }> = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '发布' },
  { value: 'offline', label: '下架' },
  { value: 'archived', label: '归档' },
];

function updateField<T, K extends keyof T>(setForm: Dispatch<SetStateAction<T>>, key: K, value: T[K]) {
  setForm((current) => ({ ...current, [key]: value }));
}

function splitTokens(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function joinTokens(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).join(', ');
}

function articleToForm(article: ApiArticle): ArticleFormState {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    summary: article.summary ?? '',
    content_markdown: article.content_markdown ?? '',
    cover_url: article.cover_url ?? '',
    category_name: article.category?.name ?? '默认',
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
    content_markdown: project.content_markdown ?? '',
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
    category_name: share.category?.name ?? '默认',
    tag_names: share.tags.map((tag) => tag.name).join(', '),
    status: share.status as ContentStatus,
    sort_order: share.sort_order,
  };
}

function statusLabel(status: string) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '未设置';
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : '操作失败，请稍后重试';
}

function renderMarkdown(markdown: string) {
  const template = document.createElement('template');
  template.innerHTML = marked.parse(markdown, { async: false }) as string;
  template.content.querySelectorAll('script, iframe, object, embed, style, link, meta').forEach((node) => node.remove());
  template.content.querySelectorAll('*').forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      if (attribute.name.startsWith('on')) node.removeAttribute(attribute.name);
      if ((attribute.name === 'href' || attribute.name === 'src') && /^javascript:/i.test(attribute.value.trim())) node.removeAttribute(attribute.name);
    });
  });
  return template.innerHTML;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="admin-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`admin-status admin-status-${status}`}>{statusLabel(status)}</span>;
}

type ContentWorkspaceProps = {
  route: AdminRoute;
  articles: ApiArticle[];
  projects: ApiProject[];
  friends: ApiFriendLink[];
  shares: ApiShare[];
  categories: ApiCategory[];
  tags: ApiTag[];
  mediaFiles: UploadedFile[];
  busy: boolean;
  onNavigate: (path: string, force?: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onReload: () => Promise<void>;
  onMessage: (message: AdminMessage) => void;
  onUploadImage: (file: File, ownerType: string, ownerId?: string, articleSlug?: string) => Promise<string | null>;
  onArchive: (resourceType: string, id: string) => void;
  onRestore: (resourceType: string, id: string) => void;
  onDelete: (resourceType: string, id: string) => void;
};

export function ContentWorkspace(props: ContentWorkspaceProps) {
  const { route, onDirtyChange } = props;
  const [articleForm, setArticleForm] = useState(emptyArticleForm);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [friendForm, setFriendForm] = useState(emptyFriendForm);
  const [shareForm, setShareForm] = useState(emptyShareForm);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [hydratedRoute, setHydratedRoute] = useState('');
  const [saving, setSaving] = useState(false);
  const routeKey = `${route.section}:${route.mode}:${route.itemId ?? ''}`;

  const activeForm = route.section === 'articles' ? articleForm
    : route.section === 'projects' ? projectForm
      : route.section === 'friends' ? friendForm : shareForm;
  const dirty = route.mode !== 'list' && hydratedRoute === routeKey && JSON.stringify(activeForm) !== savedSnapshot;

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  useEffect(() => {
    if (!dirty) return undefined;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  useEffect(() => {
    if (hydratedRoute === routeKey || route.mode === 'list') return;
    let next: ArticleFormState | ProjectFormState | FriendFormState | ShareFormState | null = null;
    if (route.mode === 'create') {
      next = route.section === 'articles' ? emptyArticleForm
        : route.section === 'projects' ? emptyProjectForm
          : route.section === 'friends' ? emptyFriendForm : emptyShareForm;
    } else if (route.section === 'articles') {
      const item = props.articles.find((candidate) => candidate.id === route.itemId);
      if (item) next = articleToForm(item);
    } else if (route.section === 'projects') {
      const item = props.projects.find((candidate) => candidate.id === route.itemId);
      if (item) next = projectToForm(item);
    } else if (route.section === 'friends') {
      const item = props.friends.find((candidate) => candidate.id === route.itemId);
      if (item) next = friendToForm(item);
    } else if (route.section === 'shares') {
      const item = props.shares.find((candidate) => candidate.id === route.itemId);
      if (item) next = shareToForm(item);
    }
    if (!next) return;
    const timer = window.setTimeout(() => {
      if (route.section === 'articles') setArticleForm(next as ArticleFormState);
      if (route.section === 'projects') setProjectForm(next as ProjectFormState);
      if (route.section === 'friends') setFriendForm(next as FriendFormState);
      if (route.section === 'shares') setShareForm(next as ShareFormState);
      setSavedSnapshot(JSON.stringify(next));
      setHydratedRoute(routeKey);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydratedRoute, props.articles, props.friends, props.projects, props.shares, route.itemId, route.mode, route.section, routeKey]);

  useEffect(() => {
    if (route.section !== 'articles' || route.mode === 'list' || hydratedRoute !== routeKey) return;
    const snippet = window.sessionStorage.getItem('admin.pendingArticleSnippet');
    if (!snippet) return;
    window.sessionStorage.removeItem('admin.pendingArticleSnippet');
    const timer = window.setTimeout(() => {
      setArticleForm((current) => ({ ...current, content_markdown: `${current.content_markdown.trimEnd()}\n\n${snippet}\n` }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydratedRoute, route.mode, route.section, routeKey]);

  if (route.mode === 'list') {
    if (route.section === 'articles') return <ContentList resource="articles" title="文章" items={props.articles} getTitle={(item) => item.title} getMeta={(item) => `${item.category.name} · ${formatDate(item.published_at ?? item.updated_at)}`} {...props} />;
    if (route.section === 'projects') return <ContentList resource="projects" title="项目" items={props.projects} getTitle={(item) => item.name} getMeta={(item) => `${item.tech_stack.join(' / ') || '未设置技术栈'} · ${formatDate(item.updated_at)}`} {...props} />;
    if (route.section === 'friends') return <ContentList resource="friends" resourceType="friend-links" title="友链" items={props.friends} getTitle={(item) => item.name} getMeta={(item) => `${item.url} · ${item.is_visible ? '展示' : '隐藏'}`} {...props} />;
    return <ContentList resource="shares" title="分享" items={props.shares} getTitle={(item) => item.title} getMeta={(item) => `${item.category.name} · ${item.type}`} {...props} />;
  }

  if (hydratedRoute !== routeKey) {
    return <article className="admin-card admin-content-not-found"><h2>{props.busy ? '正在加载内容...' : '没有找到这条内容'}</h2><button className="admin-ghost-button" type="button" onClick={() => props.onNavigate(adminSectionPath(route.section))}>返回列表</button></article>;
  }

  const commonEditorProps = { saving, busy: props.busy, dirty, route, mediaFiles: props.mediaFiles, onNavigate: props.onNavigate, onUploadImage: props.onUploadImage };

  const saveArticle = async (event: FormEvent, intent: SaveIntent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: articleForm.title,
        slug: articleForm.slug || undefined,
        summary: articleForm.summary || undefined,
        content_markdown: articleForm.content_markdown,
        cover_url: articleForm.cover_url || undefined,
        category_name: articleForm.category_name || '默认',
        tag_names: splitTokens(articleForm.tag_names),
        status: articleForm.status,
        is_pinned: articleForm.is_pinned,
        sort_order: articleForm.sort_order,
      };
      const saved = articleForm.id ? await updateArticle(articleForm.id, payload) : await createArticle(payload);
      const next = articleToForm(saved);
      setArticleForm(next); setSavedSnapshot(JSON.stringify(next));
      props.onMessage({ type: 'success', text: articleForm.id ? '文章已更新' : '文章已创建' });
      await props.onReload();
      props.onNavigate(intent === 'return' ? adminSectionPath('articles') : adminEditorPath('articles', saved.id), true);
    } catch (error) { props.onMessage({ type: 'error', text: errorText(error) }); } finally { setSaving(false); }
  };

  const saveProject = async (event: FormEvent, intent: SaveIntent) => {
    event.preventDefault(); setSaving(true);
    try {
      const payload = { name: projectForm.name, slug: projectForm.slug || undefined, description: projectForm.description || undefined, content_markdown: projectForm.content_markdown, cover_url: projectForm.cover_url || undefined, tech_stack: splitTokens(projectForm.tech_stack), github_url: projectForm.github_url || undefined, demo_url: projectForm.demo_url || undefined, status: projectForm.status, sort_order: projectForm.sort_order };
      const saved = projectForm.id ? await updateProject(projectForm.id, payload) : await createProject(payload);
      const next = projectToForm(saved); setProjectForm(next); setSavedSnapshot(JSON.stringify(next));
      props.onMessage({ type: 'success', text: projectForm.id ? '项目已更新' : '项目已创建' });
      await props.onReload();
      props.onNavigate(intent === 'return' ? adminSectionPath('projects') : adminEditorPath('projects', saved.id), true);
    } catch (error) { props.onMessage({ type: 'error', text: errorText(error) }); } finally { setSaving(false); }
  };

  const saveFriend = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const payload = { name: friendForm.name, url: friendForm.url, avatar_url: friendForm.avatar_url || undefined, description: friendForm.description || undefined, is_visible: friendForm.is_visible, status: friendForm.status, sort_order: friendForm.sort_order };
      const saved = friendForm.id ? await updateFriendLink(friendForm.id, payload) : await createFriendLink(payload);
      const next = friendToForm(saved); setFriendForm(next); setSavedSnapshot(JSON.stringify(next));
      props.onMessage({ type: 'success', text: friendForm.id ? '友链已更新' : '友链已创建' });
      await props.onReload(); props.onNavigate(adminSectionPath('friends'), true);
    } catch (error) { props.onMessage({ type: 'error', text: errorText(error) }); } finally { setSaving(false); }
  };

  const saveShare = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const payload = { title: shareForm.title, type: shareForm.type, external_url: shareForm.external_url, description: shareForm.description || undefined, cover_url: shareForm.cover_url || undefined, category_name: shareForm.category_name || '默认', tag_names: splitTokens(shareForm.tag_names), status: shareForm.status, sort_order: shareForm.sort_order };
      const saved = shareForm.id ? await updateShare(shareForm.id, payload) : await createShare(payload);
      const next = shareToForm(saved); setShareForm(next); setSavedSnapshot(JSON.stringify(next));
      props.onMessage({ type: 'success', text: shareForm.id ? '分享已更新' : '分享已创建' });
      await props.onReload(); props.onNavigate(adminSectionPath('shares'), true);
    } catch (error) { props.onMessage({ type: 'error', text: errorText(error) }); } finally { setSaving(false); }
  };

  if (route.section === 'articles') return <ArticleEditor form={articleForm} setForm={setArticleForm} categories={props.categories} tags={props.tags} onSave={saveArticle} onImport={async (file) => { setSaving(true); try { const saved = await importMarkdownArticle(file, articleForm.category_name || '默认'); const next = articleToForm(saved); setArticleForm(next); setSavedSnapshot(JSON.stringify(next)); await props.onReload(); props.onNavigate(adminEditorPath('articles', saved.id), true); props.onMessage({ type: 'success', text: 'Markdown 已导入' }); } catch (error) { props.onMessage({ type: 'error', text: errorText(error) }); } finally { setSaving(false); } }} {...commonEditorProps} />;
  if (route.section === 'projects') return <ProjectEditor form={projectForm} setForm={setProjectForm} onSave={saveProject} {...commonEditorProps} />;
  if (route.section === 'friends') return <FriendEditor form={friendForm} setForm={setFriendForm} onSave={saveFriend} {...commonEditorProps} />;
  return <ShareEditor form={shareForm} setForm={setShareForm} categories={props.categories} tags={props.tags} onSave={saveShare} {...commonEditorProps} />;
}

type ListProps<T extends { id: string; status: string }> = ContentWorkspaceProps & {
  resource: AdminEditorResource;
  resourceType?: string;
  title: string;
  items: T[];
  getTitle: (item: T) => string;
  getMeta: (item: T) => string;
};

function ContentList<T extends { id: string; status: string }>({ resource, resourceType = resource, title, items, getTitle, getMeta, onNavigate, onArchive, onRestore, onDelete }: ListProps<T>) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const filtered = useMemo(() => items.filter((item) => {
    const matchesStatus = status === 'all' || item.status === status;
    const haystack = `${getTitle(item)} ${getMeta(item)}`.toLocaleLowerCase();
    return matchesStatus && haystack.includes(query.trim().toLocaleLowerCase());
  }), [getMeta, getTitle, items, query, status]);
  return (
    <section className="admin-content-list-page">
      <article className="admin-card">
        <div className="admin-content-page-head"><div><p className="admin-eyebrow">Content</p><h2>{title}管理</h2><p>共 {items.length} 条，当前显示 {filtered.length} 条</p></div><button className="admin-primary-button" type="button" onClick={() => onNavigate(adminEditorPath(resource))}>新增{title}</button></div>
        <div className="admin-content-filters"><input type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder={`搜索${title}标题或信息`} /><select value={status} onChange={(event) => setStatus(event.currentTarget.value)}><option value="all">全部状态</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        <div className="admin-content-table">
          {filtered.map((item) => <div className="admin-content-row" role="button" tabIndex={0} key={item.id} onClick={() => onNavigate(adminEditorPath(resource, item.id))} onKeyDown={(event) => { if (event.key === 'Enter') onNavigate(adminEditorPath(resource, item.id)); }}><div><strong>{getTitle(item)}</strong><small>{getMeta(item)}</small></div><StatusBadge status={item.status} /><div className="admin-row-actions" onClick={(event) => event.stopPropagation()}>{item.status === 'archived' ? <button type="button" onClick={() => onRestore(resourceType, item.id)}>恢复</button> : <button type="button" onClick={() => onArchive(resourceType, item.id)}>归档</button>}<button type="button" className="danger" onClick={() => onDelete(resourceType, item.id)}>删除</button></div></div>)}
          {filtered.length === 0 && <p className="admin-empty">没有符合条件的内容。</p>}
        </div>
      </article>
    </section>
  );
}

type CommonEditorProps = {
  saving: boolean; busy: boolean; dirty: boolean; route: AdminRoute; mediaFiles: UploadedFile[];
  onNavigate: (path: string, force?: boolean) => void;
  onUploadImage: (file: File, ownerType: string, ownerId?: string, articleSlug?: string) => Promise<string | null>;
};

function EditorShell({ resource, title, dirty, saving, busy, children, onSubmit, allowContinue, onNavigate }: CommonEditorProps & { resource: AdminEditorResource; title: string; children: React.ReactNode; onSubmit: (event: FormEvent, intent: SaveIntent) => void; allowContinue?: boolean }) {
  const intentRef = useRef<SaveIntent>('return');
  return <form className="admin-content-editor" onSubmit={(event) => onSubmit(event, intentRef.current)}><header className="admin-content-editor-head"><button className="admin-ghost-button" type="button" onClick={() => onNavigate(adminSectionPath(resource))}>返回列表</button><div><p className="admin-eyebrow">Editor</p><h2>{title}</h2></div><span className={dirty ? 'admin-save-state dirty' : 'admin-save-state'}>{dirty ? '有未保存修改' : '已保存'}</span></header><div className="admin-content-editor-body">{children}</div><footer className="admin-content-action-bar"><button className="admin-ghost-button" type="button" onClick={() => onNavigate(adminSectionPath(resource))}>取消</button>{allowContinue && <button className="admin-ghost-button" type="submit" disabled={saving || busy} onClick={() => { intentRef.current = 'continue'; }}>保存并继续编辑</button>}<button className="admin-primary-button" type="submit" disabled={saving || busy} onClick={() => { intentRef.current = 'return'; }}>{saving ? '保存中...' : '保存并返回列表'}</button></footer></form>;
}

function MediaField({ label, value, files, onChange, onUpload }: { label: string; value: string; files: UploadedFile[]; onChange: (value: string) => void; onUpload: (file: File) => void }) {
  const images = files.filter((file) => file.mime_type.startsWith('image/'));
  return <div className="admin-media-field"><div className="admin-media-preview">{value ? <img src={value} alt="媒体预览" /> : <span>暂无图片</span>}</div><div className="admin-media-controls"><Field label={label}><input value={value} onChange={(event) => onChange(event.currentTarget.value)} placeholder="/uploads/... 或完整 URL" /></Field><div className="admin-two-col"><label className="admin-file-field"><span>上传图片</span><input type="file" accept="image/*" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ''; }} /></label><Field label="从媒体库选择"><select value="" onChange={(event) => { if (event.currentTarget.value) onChange(event.currentTarget.value); }}><option value="">选择已有图片</option>{images.map((file) => <option value={file.url} key={file.id}>{file.original_name}</option>)}</select></Field></div>{value && <a className="admin-content-url" href={value} target="_blank" rel="noreferrer">打开当前图片</a>}</div></div>;
}

function CategorySelect({ value, categories, type, onChange }: { value: string; categories: ApiCategory[]; type: string; onChange: (value: string) => void }) {
  const options = categories.filter((category) => category.type === type || category.type === 'all');
  const names = Array.from(new Set([value, ...options.map((option) => option.name), '默认'].filter(Boolean)));
  return <Field label="分类"><select value={value} onChange={(event) => onChange(event.currentTarget.value)}>{names.map((name) => <option key={name} value={name}>{name}</option>)}</select></Field>;
}

function TagSelector({ value, tags, type, onChange }: { value: string; tags: ApiTag[]; type: string; onChange: (value: string) => void }) {
  const selected = splitTokens(value);
  const [query, setQuery] = useState('');
  const choices = tags.filter((tag) => (tag.type === type || tag.type === 'all') && tag.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const toggle = (name: string) => onChange(joinTokens(selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name]));
  const addQuery = () => { if (query.trim()) { onChange(joinTokens([...selected, query])); setQuery(''); } };
  return <div className="admin-token-field"><span>标签</span><div className="admin-token-list">{selected.map((name) => <button type="button" key={name} onClick={() => toggle(name)}>{name} ×</button>)}</div><input value={query} onChange={(event) => setQuery(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addQuery(); } }} placeholder="搜索或输入标签，回车添加" /><div className="admin-token-suggestions">{choices.slice(0, 8).map((tag) => <button type="button" className={selected.includes(tag.name) ? 'selected' : undefined} key={tag.id} onClick={() => toggle(tag.name)}>{tag.name}</button>)}</div></div>;
}

function TokenInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  const tokens = splitTokens(value); const [input, setInput] = useState('');
  const add = () => { if (input.trim()) { onChange(joinTokens([...tokens, input])); setInput(''); } };
  return <div className="admin-token-field"><span>{label}</span><div className="admin-token-list">{tokens.map((token) => <button type="button" key={token} onClick={() => onChange(joinTokens(tokens.filter((item) => item !== token)))}>{token} ×</button>)}</div><input value={input} onChange={(event) => setInput(event.currentTarget.value)} onBlur={add} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(); } }} placeholder={placeholder} /></div>;
}

function ArticleEditor({ form, setForm, categories, tags, onSave, onImport, ...common }: CommonEditorProps & { form: ArticleFormState; setForm: Dispatch<SetStateAction<ArticleFormState>>; categories: ApiCategory[]; tags: ApiTag[]; onSave: (event: FormEvent, intent: SaveIntent) => void; onImport: (file: File) => Promise<void> }) {
  const [preview, setPreview] = useState(false); const html = useMemo(() => renderMarkdown(form.content_markdown), [form.content_markdown]);
  const insertImages = async (files: FileList | File[]) => { const snippets: string[] = []; for (const file of Array.from(files).filter((item) => item.type.startsWith('image/'))) { const url = await common.onUploadImage(file, 'article', form.id, form.slug || form.title); if (url) snippets.push(`![${file.name}](${url})`); } if (snippets.length) updateField(setForm, 'content_markdown', `${form.content_markdown.trimEnd()}\n\n${snippets.join('\n')}\n`); };
  const paste = (event: ClipboardEvent<HTMLTextAreaElement>) => { if (event.clipboardData.files.length) { event.preventDefault(); void insertImages(event.clipboardData.files); } };
  const drop = (event: DragEvent<HTMLTextAreaElement>) => { if (event.dataTransfer.files.length) { event.preventDefault(); void insertImages(event.dataTransfer.files); } };
  const shortcut = (event: KeyboardEvent<HTMLTextAreaElement>) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } };
  return <EditorShell resource="articles" title={form.id ? '编辑文章' : '新建文章'} onSubmit={onSave} allowContinue {...common}><section className="admin-card admin-editor-section"><h3>基本信息</h3><Field label="标题"><input required value={form.title} onChange={(event) => updateField(setForm, 'title', event.currentTarget.value)} /></Field><Field label="摘要"><textarea rows={3} value={form.summary} onChange={(event) => updateField(setForm, 'summary', event.currentTarget.value)} /></Field><div className="admin-two-col"><CategorySelect value={form.category_name} categories={categories} type="article" onChange={(value) => updateField(setForm, 'category_name', value)} /><Field label="状态"><select value={form.status} onChange={(event) => updateField(setForm, 'status', event.currentTarget.value as ContentStatus)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field></div><TagSelector value={form.tag_names} tags={tags} type="article" onChange={(value) => updateField(setForm, 'tag_names', value)} /></section><section className="admin-card admin-editor-section"><div className="admin-editor-section-head"><h3>正文</h3><div className="admin-segmented"><button type="button" className={!preview ? 'active' : undefined} onClick={() => setPreview(false)}>编辑</button><button type="button" className={preview ? 'active' : undefined} onClick={() => setPreview(true)}>预览</button></div></div>{preview ? <div className="admin-markdown-preview" dangerouslySetInnerHTML={{ __html: html }} /> : <textarea className="admin-markdown-editor" rows={18} value={form.content_markdown} onChange={(event) => updateField(setForm, 'content_markdown', event.currentTarget.value)} onPaste={paste} onDrop={drop} onDragOver={(event) => event.preventDefault()} onKeyDown={shortcut} placeholder="支持粘贴或拖入图片；Ctrl+S 保存。" />}<label className="admin-secondary-file">导入 Markdown<input type="file" accept=".md,text/markdown" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void onImport(file); }} /></label></section><section className="admin-card admin-editor-section"><h3>封面</h3><MediaField label="封面 URL" value={form.cover_url} files={common.mediaFiles} onChange={(value) => updateField(setForm, 'cover_url', value)} onUpload={(file) => void common.onUploadImage(file, 'article', form.id, form.slug || form.title).then((url) => url && updateField(setForm, 'cover_url', url))} /></section><details className="admin-card admin-advanced"><summary>高级设置</summary><div className="admin-two-col"><Field label="Slug" hint="留空时由后端自动生成"><input value={form.slug} onChange={(event) => updateField(setForm, 'slug', event.currentTarget.value)} /></Field><Field label="排序"><input type="number" value={form.sort_order} onChange={(event) => updateField(setForm, 'sort_order', Number(event.currentTarget.value))} /></Field></div><label className="admin-inline-check"><input type="checkbox" checked={form.is_pinned} onChange={(event) => updateField(setForm, 'is_pinned', event.currentTarget.checked)} />置顶文章</label></details></EditorShell>;
}

function ProjectEditor({ form, setForm, onSave, ...common }: CommonEditorProps & { form: ProjectFormState; setForm: Dispatch<SetStateAction<ProjectFormState>>; onSave: (event: FormEvent, intent: SaveIntent) => void }) {
  return <EditorShell resource="projects" title={form.id ? '编辑项目' : '新建项目'} onSubmit={onSave} allowContinue {...common}><section className="admin-card admin-editor-section"><h3>项目信息</h3><Field label="项目名"><input required value={form.name} onChange={(event) => updateField(setForm, 'name', event.currentTarget.value)} /></Field><Field label="简介"><textarea rows={4} value={form.description} onChange={(event) => updateField(setForm, 'description', event.currentTarget.value)} /></Field><TokenInput label="技术栈" value={form.tech_stack} onChange={(value) => updateField(setForm, 'tech_stack', value)} placeholder="输入后按回车，例如 React" /><div className="admin-two-col"><Field label="GitHub"><input type="url" value={form.github_url} onChange={(event) => updateField(setForm, 'github_url', event.currentTarget.value)} /></Field><Field label="演示链接"><input type="url" value={form.demo_url} onChange={(event) => updateField(setForm, 'demo_url', event.currentTarget.value)} /></Field></div><Field label="状态"><select value={form.status} onChange={(event) => updateField(setForm, 'status', event.currentTarget.value as ContentStatus)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field></section><section className="admin-card admin-editor-section"><h3>项目详情</h3><textarea className="admin-markdown-editor compact" rows={12} value={form.content_markdown} onChange={(event) => updateField(setForm, 'content_markdown', event.currentTarget.value)} /></section><section className="admin-card admin-editor-section"><h3>封面</h3><MediaField label="封面 URL" value={form.cover_url} files={common.mediaFiles} onChange={(value) => updateField(setForm, 'cover_url', value)} onUpload={(file) => void common.onUploadImage(file, 'project', form.id).then((url) => url && updateField(setForm, 'cover_url', url))} /></section><details className="admin-card admin-advanced"><summary>高级设置</summary><div className="admin-two-col"><Field label="Slug"><input value={form.slug} onChange={(event) => updateField(setForm, 'slug', event.currentTarget.value)} /></Field><Field label="排序"><input type="number" value={form.sort_order} onChange={(event) => updateField(setForm, 'sort_order', Number(event.currentTarget.value))} /></Field></div></details></EditorShell>;
}

function FriendEditor({ form, setForm, onSave, ...common }: CommonEditorProps & { form: FriendFormState; setForm: Dispatch<SetStateAction<FriendFormState>>; onSave: (event: FormEvent) => void }) {
  return <EditorShell resource="friends" title={form.id ? '编辑友链' : '新增友链'} onSubmit={(event) => onSave(event)} {...common}><section className="admin-card admin-editor-section"><h3>站点信息</h3><div className="admin-two-col"><Field label="站点名"><input required value={form.name} onChange={(event) => updateField(setForm, 'name', event.currentTarget.value)} /></Field><Field label="链接"><input required type="url" value={form.url} onChange={(event) => updateField(setForm, 'url', event.currentTarget.value)} /></Field></div><Field label="描述"><textarea rows={4} value={form.description} onChange={(event) => updateField(setForm, 'description', event.currentTarget.value)} /></Field><div className="admin-two-col"><Field label="状态"><select value={form.status} onChange={(event) => updateField(setForm, 'status', event.currentTarget.value as ContentStatus)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field><label className="admin-inline-check"><input type="checkbox" checked={form.is_visible} onChange={(event) => updateField(setForm, 'is_visible', event.currentTarget.checked)} />前台展示</label></div></section><section className="admin-card admin-editor-section"><h3>头像</h3><MediaField label="头像 URL" value={form.avatar_url} files={common.mediaFiles} onChange={(value) => updateField(setForm, 'avatar_url', value)} onUpload={(file) => void common.onUploadImage(file, 'friend_link', form.id).then((url) => url && updateField(setForm, 'avatar_url', url))} /></section><details className="admin-card admin-advanced"><summary>高级设置</summary><Field label="排序"><input type="number" value={form.sort_order} onChange={(event) => updateField(setForm, 'sort_order', Number(event.currentTarget.value))} /></Field></details></EditorShell>;
}

function ShareEditor({ form, setForm, categories, tags, onSave, ...common }: CommonEditorProps & { form: ShareFormState; setForm: Dispatch<SetStateAction<ShareFormState>>; categories: ApiCategory[]; tags: ApiTag[]; onSave: (event: FormEvent) => void }) {
  return <EditorShell resource="shares" title={form.id ? '编辑分享' : '新增分享'} onSubmit={(event) => onSave(event)} {...common}><section className="admin-card admin-editor-section"><h3>分享信息</h3><Field label="标题"><input required value={form.title} onChange={(event) => updateField(setForm, 'title', event.currentTarget.value)} /></Field><div className="admin-two-col"><Field label="类型"><input value={form.type} onChange={(event) => updateField(setForm, 'type', event.currentTarget.value)} /></Field><CategorySelect value={form.category_name} categories={categories} type="share" onChange={(value) => updateField(setForm, 'category_name', value)} /></div><Field label="外部链接"><input required type="url" value={form.external_url} onChange={(event) => updateField(setForm, 'external_url', event.currentTarget.value)} /></Field><Field label="简介"><textarea rows={4} value={form.description} onChange={(event) => updateField(setForm, 'description', event.currentTarget.value)} /></Field><TagSelector value={form.tag_names} tags={tags} type="share" onChange={(value) => updateField(setForm, 'tag_names', value)} /><Field label="状态"><select value={form.status} onChange={(event) => updateField(setForm, 'status', event.currentTarget.value as ContentStatus)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field></section><section className="admin-card admin-editor-section"><h3>封面</h3><MediaField label="封面 URL" value={form.cover_url} files={common.mediaFiles} onChange={(value) => updateField(setForm, 'cover_url', value)} onUpload={(file) => void common.onUploadImage(file, 'share', form.id).then((url) => url && updateField(setForm, 'cover_url', url))} /></section><details className="admin-card admin-advanced"><summary>高级设置</summary><Field label="排序"><input type="number" value={form.sort_order} onChange={(event) => updateField(setForm, 'sort_order', Number(event.currentTarget.value))} /></Field></details></EditorShell>;
}
