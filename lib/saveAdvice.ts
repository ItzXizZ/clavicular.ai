import { authFetch } from '@/lib/apiClient';

export type AdviceType = 'softmax' | 'hardmax' | 'physique' | 'fashion' | 'after_image';

const CACHE_PREFIX = 'clavicular-advice:';

function cacheKey(type: AdviceType): string {
  return `${CACHE_PREFIX}${type}`;
}

function readLocalCache<T>(type: AdviceType): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(cacheKey(type));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLocalCache(type: AdviceType, payload: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(cacheKey(type), JSON.stringify(payload));
  } catch {
    // Quota / private mode — ignore
  }
}

/** Instant local read (no network). Used to avoid blank/reset flashes. */
export function peekSavedAdvice<T>(type: AdviceType): T | null {
  return readLocalCache<T>(type);
}

export async function loadSavedAdvice<T>(type: AdviceType): Promise<T | null> {
  const local = readLocalCache<T>(type);

  try {
    const res = await authFetch(`/api/saved-advice?type=${type}`);
    if (!res.ok) return local;
    const data = await res.json();
    const payload = (data.advice?.payload as T) ?? null;
    if (payload != null) {
      writeLocalCache(type, payload);
      return payload;
    }
    return local;
  } catch {
    return local;
  }
}

export async function persistAdvice(type: AdviceType, payload: unknown): Promise<boolean> {
  writeLocalCache(type, payload);

  try {
    const res = await authFetch('/api/saved-advice', {
      method: 'POST',
      body: JSON.stringify({ type, payload }),
    });
    if (!res.ok) {
      console.error('[persistAdvice] server save failed', type, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[persistAdvice] network error', type, err);
    return false;
  }
}

export async function loadAllSavedAdvice(): Promise<
  Partial<Record<AdviceType, unknown>>
> {
  const types: AdviceType[] = ['softmax', 'hardmax', 'physique', 'fashion', 'after_image'];
  const out: Partial<Record<AdviceType, unknown>> = {};

  for (const type of types) {
    const local = readLocalCache(type);
    if (local != null) out[type] = local;
  }

  try {
    const res = await authFetch('/api/saved-advice');
    if (!res.ok) return out;
    const data = await res.json();
    const rows = (data.advice || []) as Array<{ type: AdviceType; payload: unknown }>;
    for (const row of rows) {
      if (!row?.type) continue;
      out[row.type] = row.payload;
      writeLocalCache(row.type, row.payload);
    }
  } catch {
    // keep local
  }

  return out;
}
