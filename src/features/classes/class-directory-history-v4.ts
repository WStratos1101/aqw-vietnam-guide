/** AQWVN: Class directory filters/pagination are URL state, not transient component state. */
const RETURN_KEY = 'aqwvn:class-directory:v4:return';
const STAGES = new Set(['all', 'Newbie', 'Midgame', 'Lategame', 'Endgame', 'Calendar', 'HeroMart']);
const ACQUISITIONS = new Set(['all','free','reputation','questline','member','seasonal','token','ac-shop','unknown']);

export type ClassDirectorySnapshot = {
  category: string;
  query: string;
  role: string;
  acquisition: string;
  page: number;
};

export function readClassDirectoryState(): ClassDirectorySnapshot {
  if (typeof window === 'undefined') return {category:'all',query:'',role:'all',acquisition:'all',page:1};
  const search = new URLSearchParams(window.location.search);
  const stage = search.get('stage') || 'all';
  const pageRaw = Number(search.get('page') || '1');
  const acquisition = search.get('acquisition') || 'all';
  const role = search.get('role') || 'all';
  return {
    category: STAGES.has(stage) ? stage : 'all',
    query: (search.get('q') || '').slice(0,200),
    role: role.length <= 90 ? role : 'all',
    acquisition: ACQUISITIONS.has(acquisition) ? acquisition : 'all',
    page: Number.isSafeInteger(pageRaw) && pageRaw >= 1 && pageRaw <= 1000 ? pageRaw : 1,
  };
}

export function persistClassDirectoryState(state: ClassDirectorySnapshot): void {
  if (typeof window === 'undefined' || window.location.pathname.replace(/\/$/, '') !== '/class') return;
  const url = new URL(window.location.href);
  for (const name of ['stage','q','role','acquisition','page']) url.searchParams.delete(name);
  if (state.category !== 'all') url.searchParams.set('stage', state.category);
  if (state.query.trim()) url.searchParams.set('q', state.query.trim());
  if (state.role !== 'all') url.searchParams.set('role', state.role);
  if (state.acquisition !== 'all') url.searchParams.set('acquisition', state.acquisition);
  if (state.page > 1) url.searchParams.set('page', String(state.page));
  const next = url.pathname + url.search + url.hash;
  if (next !== window.location.pathname + window.location.search + window.location.hash) {
    // No new history entry for each keystroke. Preserve App.tsx's aqwPrevious field.
    window.history.replaceState(window.history.state, '', next);
  }
}

export function rememberClassDirectoryLocation(): void {
  if (typeof window === 'undefined' || window.location.pathname.replace(/\/$/, '') !== '/class') return;
  try {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify({
      url: window.location.pathname + window.location.search,
      scrollY: Math.max(0, Math.round(window.scrollY)),
      restore: true,
    }));
  } catch { /* Site still works when storage is denied. */ }
}

function validReturnUrl(candidate: unknown): candidate is string {
  return typeof candidate === 'string' && /^\/class(?:\?.*)?$/.test(candidate) && candidate.length < 1800;
}

export function getClassDirectoryReturnUrl(): string {
  if (typeof window === 'undefined') return '/class';
  const previous = (window.history.state as {aqwPrevious?:unknown} | null)?.aqwPrevious;
  if (validReturnUrl(previous)) return previous;
  try {
    const payload = JSON.parse(sessionStorage.getItem(RETURN_KEY) || '{}') as {url?:unknown};
    if (validReturnUrl(payload.url)) return payload.url;
  } catch { /* fallback below */ }
  return '/class';
}

export function restoreClassDirectoryScroll(): void {
  if (typeof window === 'undefined' || window.location.pathname.replace(/\/$/, '') !== '/class') return;
  try {
    const payload = JSON.parse(sessionStorage.getItem(RETURN_KEY) || '{}') as {
      url?:unknown; scrollY?:unknown; restore?:boolean;
    };
    if (!payload.restore || !validReturnUrl(payload.url) || payload.url !== window.location.pathname + window.location.search) return;
    sessionStorage.setItem(RETURN_KEY, JSON.stringify({...payload, restore:false}));
    const y = typeof payload.scrollY === 'number' && Number.isFinite(payload.scrollY) ? payload.scrollY : 0;
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, Math.max(0,y))));
  } catch { /* No scroll restoration when storage unavailable. */ }
}
