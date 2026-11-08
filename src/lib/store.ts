import { Preferences } from '@capacitor/preferences'
import type { AdState, Settings } from '../types'

/** Tiny persisted key-value store: loaded once at startup into memory, written through to Capacitor Preferences. */
export interface Persisted {
  settings: Settings
  favourites: number[]
  recents: number[]
  streak: { last: string; count: number }
  ads: AdState
  adsRemoved: boolean
}

export const defaults: Persisted = {
  settings: { theme: 'system', fontSize: 20, reminder: null, instrument: 'organ' },
  favourites: [],
  recents: [],
  streak: { last: '', count: 0 },
  ads: { sessions: 0, opensSinceAd: 0, lastAdAt: 0, adFreeUntil: 0 },
  adsRemoved: false,
}

const KEY = 'hymns-daily-v1'
const MAX_HYMN = 100000

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown, fallback: number, min: number, max: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback)
const ids = (v: unknown): number[] =>
  Array.isArray(v) ? [...new Set(v.filter((n): n is number => Number.isInteger(n) && n > 0 && n < MAX_HYMN))].slice(0, 500) : []

/** Never trust stored JSON: it can be truncated, hand-edited, or from an older build. Every field is coerced to a safe value. */
export function sanitize(raw: unknown): Persisted {
  const d = structuredClone(defaults)
  if (!isObj(raw)) return d
  const s = isObj(raw.settings) ? raw.settings : {}
  const a = isObj(raw.ads) ? raw.ads : {}
  const st = isObj(raw.streak) ? raw.streak : {}
  return {
    settings: {
      theme: oneOf(s.theme, ['system', 'light', 'dark'] as const, d.settings.theme),
      fontSize: num(s.fontSize, d.settings.fontSize, 14, 40),
      instrument: oneOf(s.instrument, ['organ', 'piano'] as const, d.settings.instrument),
      reminder: typeof s.reminder === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s.reminder) ? s.reminder : null,
    },
    favourites: ids(raw.favourites),
    recents: ids(raw.recents).slice(0, 30),
    streak: { last: typeof st.last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(st.last) ? st.last : '', count: num(st.count, 0, 0, 100000) },
    ads: {
      sessions: num(a.sessions, 0, 0, 1e9),
      opensSinceAd: num(a.opensSinceAd, 0, 0, 1e6),
      lastAdAt: num(a.lastAdAt, 0, 0, 1e15),
      adFreeUntil: num(a.adFreeUntil, 0, 0, 1e15),
    },
    adsRemoved: raw.adsRemoved === true,
  }
}

export async function loadStore(): Promise<Persisted> {
  try {
    const { value } = await Preferences.get({ key: KEY })
    if (!value || value.length > 200_000) return structuredClone(defaults)
    return sanitize(JSON.parse(value))
  } catch {
    return structuredClone(defaults)
  }
}

export const saveStore = (p: Persisted): Promise<void> => Preferences.set({ key: KEY, value: JSON.stringify(p) }).catch(() => undefined)
