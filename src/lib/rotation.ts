import type { Hymn } from '../types'

/** Day number since epoch for a local calendar date (stable across timezones/DST). */
export const dayNumber = (d: Date): number => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)

/** Gregorian Easter Sunday (anonymous algorithm). */
export function easterSunday(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

/** Seasonal pool of categories for a date, or null for the general rotation. */
export function seasonalCategories(d: Date): string[] | null {
  if (d.getMonth() === 11) return d.getDate() <= 24 ? ['ADVENT', 'CHRISTMAS'] : ['CHRISTMAS']
  const diff = dayNumber(d) - dayNumber(easterSunday(d.getFullYear()))
  if (diff >= -7 && diff <= 7) return ['EASTER']
  return null
}

/** Deterministic hymn for a date: same date => same hymn; seasonal pool when applicable. */
export function hymnOfDay(hymns: Hymn[], d: Date): Hymn {
  const seasonal = seasonalCategories(d)
  const pool = seasonal ? hymns.filter((h) => seasonal.includes(h.category)) : hymns.filter((h) => !['ADVENT', 'CHRISTMAS', 'EASTER'].includes(h.category))
  const list = pool.length ? pool : hymns
  return list[dayNumber(d) % list.length]
}

export function verseOfDay<T>(verses: T[], d: Date): T {
  return verses[dayNumber(d) % verses.length]
}

export const dayKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Update streak: consecutive days opened. */
export function nextStreak(prev: { last: string; count: number }, today: Date): { last: string; count: number } {
  const key = dayKey(today)
  if (prev.last === key) return prev
  const y = new Date(today)
  y.setDate(y.getDate() - 1)
  return { last: key, count: prev.last === dayKey(y) ? prev.count + 1 : 1 }
}
