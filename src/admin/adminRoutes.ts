export type AdminSection = 'dashboard' | 'articles' | 'projects' | 'friends' | 'shares' | 'media' | 'taxonomy' | 'analytics' | 'site' | 'password';
export type AdminEditorResource = 'articles' | 'projects' | 'friends' | 'shares';

export type AdminRoute = {
  section: AdminSection;
  mode: 'list' | 'create' | 'edit';
  itemId?: string;
};

const knownSections = new Set<AdminSection>([
  'dashboard',
  'articles',
  'projects',
  'friends',
  'shares',
  'media',
  'taxonomy',
  'analytics',
  'site',
  'password',
]);

const editorSections = new Set<AdminEditorResource>(['articles', 'projects', 'friends', 'shares']);

export function parseAdminRoute(pathname = window.location.pathname): AdminRoute {
  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/');
  const candidate = segments[1] as AdminSection | undefined;
  const section = candidate && knownSections.has(candidate) ? candidate : 'dashboard';

  if (!editorSections.has(section as AdminEditorResource)) {
    return { section, mode: 'list' };
  }

  const detail = segments[2];
  if (detail === 'new') return { section, mode: 'create' };
  if (detail) return { section, mode: 'edit', itemId: decodeURIComponent(detail) };
  return { section, mode: 'list' };
}

export function adminSectionPath(section: AdminSection) {
  return section === 'dashboard' ? '/admin' : `/admin/${section}`;
}

export function adminEditorPath(resource: AdminEditorResource, itemId?: string) {
  return itemId ? `/admin/${resource}/${encodeURIComponent(itemId)}` : `/admin/${resource}/new`;
}
