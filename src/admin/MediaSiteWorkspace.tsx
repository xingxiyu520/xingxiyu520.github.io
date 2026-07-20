import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react';
import { ApiError } from '../api/client';
import {
  deleteUpload,
  getSiteConfig,
  listUploads,
  updateSiteConfig,
  uploadAdminFile,
  type UploadedFile,
} from '../api/adminContent';
import { copyTextToClipboard, toAbsoluteUrl } from '../utils/clipboard';
import {
  normalizeGalleryPhotos,
  normalizeMusicTracks,
  type GalleryPhotoConfig,
  type MusicTrackConfig,
} from './configTypes';
import './MediaSiteWorkspace.css';

export type MediaSiteWorkspaceMode = 'media' | 'site';

export type MediaSiteNotification = {
  type: 'success' | 'error' | 'info';
  text: string;
};

export type MediaSiteWorkspaceProps = {
  mode: MediaSiteWorkspaceMode;
  onNotify?: (notification: MediaSiteNotification) => void;
  onInsertToArticle?: (snippet: string, file: UploadedFile) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

type SiteFormState = {
  profileName: string;
  avatarUrl: string;
  headingAccent: string;
  homeStatus: string;
  github: string;
  email: string;
  galleryPhotos: GalleryPhotoConfig[];
  musicTracks: MusicTrackConfig[];
};

type PickerKind = 'gallery' | 'music' | null;

const emptySiteForm: SiteFormState = {
  profileName: '',
  avatarUrl: '',
  headingAccent: '',
  homeStatus: '',
  github: '',
  email: '',
  galleryPhotos: [],
  musicTracks: [],
};

function errorText(error: unknown) {
  if (error instanceof ApiError) {
    return typeof error.detail === 'string' ? error.detail : error.message;
  }
  return error instanceof Error ? error.message : '操作失败，请稍后重试';
}

function readText(configs: Record<string, unknown>, key: string) {
  return typeof configs[key] === 'string' ? configs[key] as string : '';
}

function fileLabel(file: UploadedFile) {
  return file.original_name.replace(/\.[^.]+$/, '').trim() || '未命名素材';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return value ? new Date(value).toLocaleDateString('zh-CN') : '未知日期';
}

function formatDuration(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  return `${minutes}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function replaceItem<T>(items: T[], index: number, updates: Partial<T>) {
  return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item);
}

function audioDurationFromSource(source: string) {
  return new Promise<number>((resolve) => {
    const audio = document.createElement('audio');
    let settled = false;
    const finish = (duration: number) => {
      if (settled) return;
      settled = true;
      audio.removeAttribute('src');
      audio.load();
      resolve(Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 180);
    };
    const timer = window.setTimeout(() => finish(180), 8000);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      window.clearTimeout(timer);
      finish(audio.duration);
    };
    audio.onerror = () => {
      window.clearTimeout(timer);
      finish(180);
    };
    audio.src = source;
  });
}

async function audioDurationFromFile(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await audioDurationFromSource(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function MediaSiteWorkspace({ mode, onNotify, onInsertToArticle, onDirtyChange }: MediaSiteWorkspaceProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [siteForm, setSiteForm] = useState<SiteFormState>(emptySiteForm);
  const [savedSiteSnapshot, setSavedSiteSnapshot] = useState(() => JSON.stringify(emptySiteForm));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [localNotice, setLocalNotice] = useState<MediaSiteNotification | null>(null);

  const notify = useCallback((notification: MediaSiteNotification) => {
    setLocalNotice(notification);
    onNotify?.(notification);
  }, [onNotify]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setLocalNotice(null);
    try {
      if (mode === 'media') {
        setFiles(await listUploads());
      } else {
        const [siteData, uploadData] = await Promise.all([getSiteConfig(), listUploads()]);
        const nextForm: SiteFormState = {
          profileName: readText(siteData.configs, 'profile.name'),
          avatarUrl: readText(siteData.configs, 'profile.avatarUrl'),
          headingAccent: readText(siteData.configs, 'hero.headingAccent'),
          homeStatus: readText(siteData.configs, 'home.status'),
          github: readText(siteData.configs, 'contact.github'),
          email: readText(siteData.configs, 'contact.email'),
          galleryPhotos: normalizeGalleryPhotos(siteData.configs['home.galleryPhotos']),
          musicTracks: normalizeMusicTracks(siteData.configs['home.musicTracks']),
        };
        setFiles(uploadData);
        setSiteForm(nextForm);
        setSavedSiteSnapshot(JSON.stringify(nextForm));
      }
    } catch (error) {
      notify({ type: 'error', text: errorText(error) });
    } finally {
      setLoading(false);
    }
  }, [mode, notify]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  const siteDirty = mode === 'site' && JSON.stringify(siteForm) !== savedSiteSnapshot;

  useEffect(() => {
    onDirtyChange?.(siteDirty);
    return () => onDirtyChange?.(false);
  }, [onDirtyChange, siteDirty]);

  useEffect(() => {
    if (!siteDirty) return undefined;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [siteDirty]);

  const uploadFile = useCallback(async (file: File, ownerType: 'gallery' | 'music' | 'site_config') => {
    const uploaded = await uploadAdminFile(file, ownerType);
    setFiles((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)]);
    return uploaded;
  }, []);

  if (loading) {
    return <div className="msw-loading" role="status">正在加载媒体与站点配置...</div>;
  }

  return (
    <section className="msw-workspace">
      {localNotice && (
        <div className={`msw-notice msw-notice-${localNotice.type}`} role="status">
          <span>{localNotice.text}</span>
          <button type="button" aria-label="关闭提示" title="关闭提示" onClick={() => setLocalNotice(null)}>×</button>
        </div>
      )}

      {mode === 'media' ? (
        <MediaLibrary
          files={files}
          busy={busy}
          setBusy={setBusy}
          setFiles={setFiles}
          notify={notify}
          uploadFile={uploadFile}
          onInsertToArticle={onInsertToArticle}
        />
      ) : (
        <SiteConfiguration
          files={files}
          form={siteForm}
          setForm={setSiteForm}
          busy={busy}
          dirty={siteDirty}
          setBusy={setBusy}
          setSavedSnapshot={setSavedSiteSnapshot}
          notify={notify}
          uploadFile={uploadFile}
        />
      )}
    </section>
  );
}

type UploadHandler = (file: File, ownerType: 'gallery' | 'music' | 'site_config') => Promise<UploadedFile>;

function MediaLibrary({
  files,
  busy,
  setBusy,
  setFiles,
  notify,
  uploadFile,
  onInsertToArticle,
}: {
  files: UploadedFile[];
  busy: boolean;
  setBusy: (busy: boolean) => void;
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  notify: (notification: MediaSiteNotification) => void;
  uploadFile: UploadHandler;
  onInsertToArticle?: (snippet: string, file: UploadedFile) => void;
}) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [ownerType, setOwnerType] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const ownerTypes = useMemo(() => (
    Array.from(new Set(files.map((file) => file.owner_type).filter((value): value is string => Boolean(value)))).sort()
  ), [files]);

  const filteredFiles = useMemo(() => files.filter((file) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery = !normalizedQuery || `${file.original_name} ${file.url} ${file.mime_type}`.toLowerCase().includes(normalizedQuery);
    const matchesKind = kind === 'all'
      || (kind === 'image' && file.mime_type.startsWith('image/'))
      || (kind === 'audio' && file.mime_type.startsWith('audio/'));
    const matchesOwner = ownerType === 'all' || file.owner_type === ownerType;
    return matchesQuery && matchesKind && matchesOwner;
  }), [files, kind, ownerType, query]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, targetKind: 'gallery' | 'music') => {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (selectedFiles.length === 0) return;
    setBusy(true);
    try {
      for (const file of selectedFiles) {
        await uploadFile(file, targetKind);
      }
      notify({ type: 'success', text: `已上传 ${selectedFiles.length} 个文件` });
    } catch (error) {
      notify({ type: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async (file: UploadedFile) => {
    try {
      await copyTextToClipboard(toAbsoluteUrl(file.url));
      setCopiedId(file.id);
      notify({ type: 'success', text: '完整 URL 已复制' });
      window.setTimeout(() => setCopiedId((current) => current === file.id ? null : current), 1800);
    } catch {
      notify({ type: 'error', text: '复制失败，请点击 URL 后手动复制' });
    }
  };

  const handleDelete = async (file: UploadedFile) => {
    if (file.is_used) {
      notify({ type: 'info', text: '该文件仍被内容引用，请先移除引用' });
      return;
    }
    if (!window.confirm(`永久删除“${file.original_name}”？此操作不能撤销。`)) return;
    setBusy(true);
    try {
      await deleteUpload(file.id);
      setFiles((current) => current.filter((item) => item.id !== file.id));
      notify({ type: 'success', text: '媒体文件已删除' });
    } catch (error) {
      notify({ type: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleInsert = (file: UploadedFile) => {
    const snippet = file.mime_type.startsWith('audio/')
      ? `<audio controls src="${file.url}"></audio>`
      : `![${fileLabel(file)}](${file.url})`;
    onInsertToArticle?.(snippet, file);
    notify({ type: 'success', text: '媒体引用已插入文章编辑器' });
  };

  return (
    <div className="msw-stack">
      <header className="msw-section-head">
        <div>
          <p className="msw-eyebrow">Media Library</p>
          <h2>媒体库</h2>
          <p>站内引用保存相对路径，复制按钮会生成可直接打开的完整地址。</p>
        </div>
        <div className="msw-actions">
          <label className={`msw-button msw-button-secondary${busy ? ' is-disabled' : ''}`}>
            上传图片
            <input type="file" accept="image/*" multiple disabled={busy} onChange={(event) => void handleUpload(event, 'gallery')} />
          </label>
          <label className={`msw-button msw-button-secondary${busy ? ' is-disabled' : ''}`}>
            上传音乐
            <input type="file" accept="audio/*" multiple disabled={busy} onChange={(event) => void handleUpload(event, 'music')} />
          </label>
        </div>
      </header>

      <div className="msw-filter-bar">
        <label className="msw-field msw-search-field">
          <span>搜索</span>
          <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="文件名、URL 或 MIME 类型" />
        </label>
        <label className="msw-field">
          <span>文件类型</span>
          <select value={kind} onChange={(event) => setKind(event.currentTarget.value)}>
            <option value="all">全部类型</option>
            <option value="image">图片</option>
            <option value="audio">音乐</option>
          </select>
        </label>
        <label className="msw-field">
          <span>用途</span>
          <select value={ownerType} onChange={(event) => setOwnerType(event.currentTarget.value)}>
            <option value="all">全部用途</option>
            {ownerTypes.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <p className="msw-result-count">显示 {filteredFiles.length} / {files.length} 个文件</p>
      <div className="msw-media-grid">
        {filteredFiles.map((file) => {
          const absoluteUrl = toAbsoluteUrl(file.url);
          return (
            <article className="msw-media-card" key={file.id}>
              <div className="msw-media-preview">
                {file.mime_type.startsWith('image/') ? (
                  <img src={file.url} alt={file.original_name} loading="lazy" />
                ) : (
                  <audio controls preload="none" src={file.url} />
                )}
              </div>
              <div className="msw-media-meta">
                <strong title={file.original_name}>{file.original_name}</strong>
                <small>{formatBytes(file.size_bytes)} · {file.owner_type ?? '未归类'} · {formatDate(file.created_at)}</small>
                <span className={`msw-usage${file.is_used ? ' is-used' : ''}`}>{file.is_used ? '使用中' : '未使用'}</span>
                <a href={absoluteUrl} target="_blank" rel="noreferrer" title="在新标签页打开文件">{absoluteUrl}</a>
              </div>
              <div className="msw-row-actions">
                <button type="button" onClick={() => void handleCopy(file)}>{copiedId === file.id ? '已复制' : '复制完整 URL'}</button>
                <a className="msw-inline-button" href={absoluteUrl} target="_blank" rel="noreferrer">打开</a>
                {onInsertToArticle && <button type="button" onClick={() => handleInsert(file)}>插入文章</button>}
                <button type="button" className="msw-danger" disabled={busy || file.is_used} title={file.is_used ? '使用中的文件不能删除' : '永久删除'} onClick={() => void handleDelete(file)}>删除</button>
              </div>
            </article>
          );
        })}
        {filteredFiles.length === 0 && <div className="msw-empty">没有符合筛选条件的媒体文件。</div>}
      </div>
    </div>
  );
}

function SiteConfiguration({
  files,
  form,
  setForm,
  busy,
  dirty,
  setBusy,
  setSavedSnapshot,
  notify,
  uploadFile,
}: {
  files: UploadedFile[];
  form: SiteFormState;
  setForm: React.Dispatch<React.SetStateAction<SiteFormState>>;
  busy: boolean;
  dirty: boolean;
  setBusy: (busy: boolean) => void;
  setSavedSnapshot: (snapshot: string) => void;
  notify: (notification: MediaSiteNotification) => void;
  uploadFile: UploadHandler;
}) {
  const [pickerKind, setPickerKind] = useState<PickerKind>(null);
  const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<number | null>(null);
  const [draggedTrackIndex, setDraggedTrackIndex] = useState<number | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof SiteFormState>(key: K, value: SiteFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await updateSiteConfig({
        'profile.name': form.profileName,
        'profile.avatarUrl': form.avatarUrl,
        'hero.headingAccent': form.headingAccent,
        'home.status': form.homeStatus,
        'contact.github': form.github,
        'contact.email': form.email,
        'home.galleryPhotos': form.galleryPhotos.map(({ title, caption, src, alt }) => ({ title, caption, src, alt })),
        'home.musicTracks': form.musicTracks.map(({ title, artist, src, duration }) => ({ title, artist, src, duration })),
      });
      setSavedSnapshot(JSON.stringify(form));
      notify({ type: 'success', text: '站点配置已保存' });
    } catch (error) {
      notify({ type: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      notify({ type: 'error', text: '头像只能上传图片文件' });
      return;
    }
    setBusy(true);
    try {
      const uploaded = await uploadFile(file, 'site_config');
      setField('avatarUrl', uploaded.url);
      notify({ type: 'success', text: '头像已上传，保存配置后生效' });
    } catch (error) {
      notify({ type: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.currentTarget.files ?? []).filter((file) => file.type.startsWith('image/'));
    event.currentTarget.value = '';
    if (selectedFiles.length === 0) return;
    setBusy(true);
    try {
      const additions: GalleryPhotoConfig[] = [];
      for (const file of selectedFiles) {
        const uploaded = await uploadFile(file, 'gallery');
        const title = fileLabel(uploaded);
        additions.push({ title, caption: title, src: uploaded.url, alt: title });
      }
      setForm((current) => ({ ...current, galleryPhotos: [...current.galleryPhotos, ...additions] }));
      notify({ type: 'success', text: `已上传并添加 ${additions.length} 张相册图片，保存配置后生效` });
    } catch (error) {
      notify({ type: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleMusicUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.currentTarget.files ?? []).filter((file) => file.type.startsWith('audio/'));
    event.currentTarget.value = '';
    if (selectedFiles.length === 0) return;
    setBusy(true);
    try {
      const additions: MusicTrackConfig[] = [];
      for (const file of selectedFiles) {
        const durationPromise = audioDurationFromFile(file);
        const uploaded = await uploadFile(file, 'music');
        additions.push({ title: fileLabel(uploaded), artist: '未知歌手', src: uploaded.url, duration: await durationPromise });
      }
      setForm((current) => ({ ...current, musicTracks: [...current.musicTracks, ...additions] }));
      notify({ type: 'success', text: `已上传并添加 ${additions.length} 首音乐，保存配置后生效` });
    } catch (error) {
      notify({ type: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  };

  const addMediaFromPicker = async (file: UploadedFile) => {
    if (pickerKind === 'gallery') {
      if (form.galleryPhotos.some((item) => item.src === file.url)) {
        notify({ type: 'info', text: '该图片已经在相册中' });
        return;
      }
      const title = fileLabel(file);
      setField('galleryPhotos', [...form.galleryPhotos, { title, caption: title, src: file.url, alt: title }]);
      setPickerKind(null);
      notify({ type: 'success', text: '图片已加入相册，保存配置后生效' });
      return;
    }
    if (pickerKind === 'music') {
      if (form.musicTracks.some((item) => item.src === file.url)) {
        notify({ type: 'info', text: '该音乐已经在播放列表中' });
        return;
      }
      setBusy(true);
      const duration = await audioDurationFromSource(file.url);
      setField('musicTracks', [...form.musicTracks, { title: fileLabel(file), artist: '未知歌手', src: file.url, duration }]);
      setBusy(false);
      setPickerKind(null);
      notify({ type: 'success', text: '音乐已加入播放列表，保存配置后生效' });
    }
  };

  const handleAvatarDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith('image/'));
    if (file) void handleAvatarUpload(file);
  };

  return (
    <form className="msw-stack" onSubmit={(event) => void handleSubmit(event)}>
      <header className="msw-section-head msw-sticky-head">
        <div>
          <p className="msw-eyebrow">Site Configuration</p>
          <h2>站点配置</h2>
          <p>相册和音乐可直接上传、选择和排序，不再需要编辑 JSON。</p>
        </div>
        <div className="msw-actions">
          <span className={`msw-save-state${dirty ? ' is-dirty' : ''}`}>{dirty ? '有未保存修改' : '配置已保存'}</span>
          <button className="msw-button msw-button-primary" type="submit" disabled={busy || !dirty}>{busy ? '处理中...' : '保存配置'}</button>
        </div>
      </header>

      <section className="msw-config-section">
        <div className="msw-config-heading">
          <div><p className="msw-eyebrow">Profile</p><h3>个人资料</h3></div>
          <p>这些字段会同步到首页头像、昵称和联系信息。</p>
        </div>
        <div className="msw-profile-grid">
          <div className="msw-form-grid">
            <label className="msw-field"><span>站点名</span><input value={form.profileName} onChange={(event) => setField('profileName', event.currentTarget.value)} /></label>
            <label className="msw-field"><span>首页昵称</span><input value={form.headingAccent} onChange={(event) => setField('headingAccent', event.currentTarget.value)} /></label>
            <label className="msw-field msw-span-2"><span>首页状态</span><input value={form.homeStatus} onChange={(event) => setField('homeStatus', event.currentTarget.value)} /></label>
            <label className="msw-field"><span>GitHub</span><input value={form.github} onChange={(event) => setField('github', event.currentTarget.value)} /></label>
            <label className="msw-field"><span>Email</span><input type="email" value={form.email} onChange={(event) => setField('email', event.currentTarget.value)} /></label>
            <label className="msw-field msw-span-2"><span>头像 URL</span><input value={form.avatarUrl} onChange={(event) => setField('avatarUrl', event.currentTarget.value)} /></label>
          </div>
          <div className="msw-avatar-panel" onDrop={handleAvatarDrop} onDragOver={(event) => event.preventDefault()}>
            <div className="msw-avatar-preview">
              {form.avatarUrl ? <img src={form.avatarUrl} alt="当前头像预览" /> : <span>暂无头像</span>}
            </div>
            <strong>{form.headingAccent || form.profileName || '站点昵称'}</strong>
            <small>{form.homeStatus || '首页状态预览'}</small>
            <button type="button" className="msw-button msw-button-secondary" disabled={busy} onClick={() => avatarInputRef.current?.click()}>上传头像</button>
            <input ref={avatarInputRef} className="msw-hidden-input" type="file" accept="image/*" onChange={(event) => event.currentTarget.files?.[0] && void handleAvatarUpload(event.currentTarget.files[0])} />
            <span>也可以把图片拖到这里</span>
          </div>
        </div>
      </section>

      <EditableGallery
        items={form.galleryPhotos}
        busy={busy}
        draggedIndex={draggedGalleryIndex}
        setDraggedIndex={setDraggedGalleryIndex}
        onChange={(items) => setField('galleryPhotos', items)}
        onUpload={handleGalleryUpload}
        onPick={() => setPickerKind('gallery')}
      />

      <EditableMusic
        items={form.musicTracks}
        busy={busy}
        draggedIndex={draggedTrackIndex}
        setDraggedIndex={setDraggedTrackIndex}
        onChange={(items) => setField('musicTracks', items)}
        onUpload={handleMusicUpload}
        onPick={() => setPickerKind('music')}
      />

      {pickerKind && (
        <MediaPicker
          kind={pickerKind}
          files={files}
          onClose={() => setPickerKind(null)}
          onSelect={(file) => void addMediaFromPicker(file)}
        />
      )}
    </form>
  );
}

function EditableGallery({
  items,
  busy,
  draggedIndex,
  setDraggedIndex,
  onChange,
  onUpload,
  onPick,
}: {
  items: GalleryPhotoConfig[];
  busy: boolean;
  draggedIndex: number | null;
  setDraggedIndex: (index: number | null) => void;
  onChange: (items: GalleryPhotoConfig[]) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onPick: () => void;
}) {
  const handleDrop = (event: DragEvent<HTMLElement>, targetIndex: number) => {
    event.preventDefault();
    if (draggedIndex !== null) onChange(moveItem(items, draggedIndex, targetIndex));
    setDraggedIndex(null);
  };

  return (
    <section className="msw-config-section">
      <div className="msw-config-heading">
        <div><p className="msw-eyebrow">Gallery</p><h3>首页相册</h3><p>共 {items.length} 张图片</p></div>
        <div className="msw-actions">
          <label className={`msw-button msw-button-secondary${busy ? ' is-disabled' : ''}`}>多图上传<input type="file" accept="image/*" multiple disabled={busy} onChange={onUpload} /></label>
          <button className="msw-button msw-button-secondary" type="button" disabled={busy} onClick={onPick}>从媒体库选择</button>
        </div>
      </div>
      {items.length === 0 && <div className="msw-fallback-warning">相册为空时，首页会继续显示代码内置的 fallback 图片。</div>}
      <div className="msw-editor-list">
        {items.map((item, index) => (
          <article
            className={`msw-editor-item${draggedIndex === index ? ' is-dragging' : ''}`}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragEnd={() => setDraggedIndex(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, index)}
            key={`${item.src}-${index}`}
          >
            <span className="msw-drag-handle" title="拖拽排序">⋮⋮</span>
            <img className="msw-item-image" src={item.src} alt={item.alt} />
            <div className="msw-item-fields">
              <label className="msw-field"><span>标题</span><input required value={item.title} onChange={(event) => onChange(replaceItem(items, index, { title: event.currentTarget.value }))} /></label>
              <label className="msw-field"><span>说明</span><input required value={item.caption} onChange={(event) => onChange(replaceItem(items, index, { caption: event.currentTarget.value }))} /></label>
              <label className="msw-field"><span>Alt 文本</span><input required value={item.alt} onChange={(event) => onChange(replaceItem(items, index, { alt: event.currentTarget.value }))} /></label>
              <label className="msw-field"><span>图片 URL</span><input required value={item.src} onChange={(event) => onChange(replaceItem(items, index, { src: event.currentTarget.value }))} /></label>
            </div>
            <ItemActions index={index} count={items.length} onMove={(target) => onChange(moveItem(items, index, target))} onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} />
          </article>
        ))}
      </div>
    </section>
  );
}

function EditableMusic({
  items,
  busy,
  draggedIndex,
  setDraggedIndex,
  onChange,
  onUpload,
  onPick,
}: {
  items: MusicTrackConfig[];
  busy: boolean;
  draggedIndex: number | null;
  setDraggedIndex: (index: number | null) => void;
  onChange: (items: MusicTrackConfig[]) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onPick: () => void;
}) {
  const handleDrop = (event: DragEvent<HTMLElement>, targetIndex: number) => {
    event.preventDefault();
    if (draggedIndex !== null) onChange(moveItem(items, draggedIndex, targetIndex));
    setDraggedIndex(null);
  };

  return (
    <section className="msw-config-section">
      <div className="msw-config-heading">
        <div><p className="msw-eyebrow">Music</p><h3>首页音乐</h3><p>共 {items.length} 首音乐</p></div>
        <div className="msw-actions">
          <label className={`msw-button msw-button-secondary${busy ? ' is-disabled' : ''}`}>上传音乐<input type="file" accept="audio/*" multiple disabled={busy} onChange={onUpload} /></label>
          <button className="msw-button msw-button-secondary" type="button" disabled={busy} onClick={onPick}>从媒体库选择</button>
        </div>
      </div>
      {items.length === 0 && <div className="msw-fallback-warning">音乐列表为空时，首页会继续使用代码内置的 fallback 音乐。</div>}
      <div className="msw-editor-list">
        {items.map((item, index) => (
          <article
            className={`msw-editor-item msw-track-item${draggedIndex === index ? ' is-dragging' : ''}`}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragEnd={() => setDraggedIndex(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, index)}
            key={`${item.src}-${index}`}
          >
            <span className="msw-drag-handle" title="拖拽排序">⋮⋮</span>
            <div className="msw-audio-preview">
              <span>{formatDuration(item.duration)}</span>
              <audio controls preload="none" src={item.src} />
            </div>
            <div className="msw-item-fields">
              <label className="msw-field"><span>歌名</span><input required value={item.title} onChange={(event) => onChange(replaceItem(items, index, { title: event.currentTarget.value }))} /></label>
              <label className="msw-field"><span>作者</span><input required value={item.artist} onChange={(event) => onChange(replaceItem(items, index, { artist: event.currentTarget.value }))} /></label>
              <label className="msw-field"><span>时长（秒）</span><input required min="1" step="1" type="number" value={item.duration} onChange={(event) => onChange(replaceItem(items, index, { duration: Math.max(1, Number(event.currentTarget.value) || 1) }))} /></label>
              <label className="msw-field"><span>音频 URL</span><input required value={item.src} onChange={(event) => onChange(replaceItem(items, index, { src: event.currentTarget.value }))} /></label>
            </div>
            <ItemActions index={index} count={items.length} onMove={(target) => onChange(moveItem(items, index, target))} onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} />
          </article>
        ))}
      </div>
    </section>
  );
}

function ItemActions({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (target: number) => void; onRemove: () => void }) {
  return (
    <div className="msw-item-actions">
      <button type="button" title="上移" aria-label="上移" disabled={index === 0} onClick={() => onMove(index - 1)}>↑</button>
      <button type="button" title="下移" aria-label="下移" disabled={index === count - 1} onClick={() => onMove(index + 1)}>↓</button>
      <button type="button" className="msw-danger" onClick={onRemove}>移除引用</button>
    </div>
  );
}

function MediaPicker({ kind, files, onClose, onSelect }: { kind: Exclude<PickerKind, null>; files: UploadedFile[]; onClose: () => void; onSelect: (file: UploadedFile) => void }) {
  const [query, setQuery] = useState('');
  const candidates = files.filter((file) => {
    const matchesKind = kind === 'gallery' ? file.mime_type.startsWith('image/') : file.mime_type.startsWith('audio/');
    const source = `${file.original_name} ${file.url}`.toLowerCase();
    return matchesKind && source.includes(query.trim().toLowerCase());
  });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="msw-dialog-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section className="msw-dialog" role="dialog" aria-modal="true" aria-label={kind === 'gallery' ? '选择相册图片' : '选择音乐'}>
        <header>
          <div><p className="msw-eyebrow">Media Picker</p><h3>{kind === 'gallery' ? '选择相册图片' : '选择音乐'}</h3></div>
          <button type="button" aria-label="关闭" title="关闭" onClick={onClose}>×</button>
        </header>
        <label className="msw-field"><span>搜索媒体库</span><input autoFocus value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="输入文件名或 URL" /></label>
        <div className="msw-picker-grid">
          {candidates.map((file) => (
            <button className="msw-picker-item" type="button" onClick={() => onSelect(file)} key={file.id}>
              {kind === 'gallery' ? <img src={file.url} alt="" /> : <span className="msw-picker-audio">♪</span>}
              <strong>{file.original_name}</strong>
              <small>{file.owner_type ?? '未归类'} · {formatBytes(file.size_bytes)}</small>
            </button>
          ))}
          {candidates.length === 0 && <div className="msw-empty">媒体库中没有可选文件。</div>}
        </div>
      </section>
    </div>
  );
}

export default MediaSiteWorkspace;
