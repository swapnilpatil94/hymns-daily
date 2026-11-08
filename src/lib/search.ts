import type { Hymn } from '../types'
import { normalize } from './text'

export interface SearchIndex {
  entries: { hymn: Hymn; title: string; first: string; text: string }[]
}

/** Pre-build normalised fields once so each keystroke is a cheap substring scan. */
export function buildIndex(hymns: Hymn[]): SearchIndex {
  return {
    entries: hymns.map((hymn) => ({
      hymn,
      title: normalize(hymn.title),
      first: normalize(hymn.verses[0] ?? ''),
      text: normalize([hymn.title, hymn.tune, ...hymn.verses, hymn.refrain].join(' ')),
    })),
  }
}

export interface Filters {
  category?: string
  topic?: string
}

/** A pure number query matches hymn number; otherwise all tokens must appear. Title > first line > text. */
export function search(index: SearchIndex, query: string, filters: Filters = {}): Hymn[] {
  const q = normalize(query)
  const tokens = q.split(' ').filter(Boolean)
  const passes = (h: Hymn) => (!filters.category || h.category === filters.category) && (!filters.topic || h.topics.includes(filters.topic))
  if (!tokens.length) return index.entries.filter((e) => passes(e.hymn)).map((e) => e.hymn)
  const scored: { h: Hymn; s: number }[] = []
  for (const e of index.entries) {
    if (!passes(e.hymn)) continue
    let s = 0
    if (/^\d+$/.test(q) && e.hymn.n === Number(q)) s = 100
    else if (tokens.every((t) => e.text.includes(t))) s = e.title.startsWith(q) ? 50 : e.title.includes(q) ? 40 : e.first.includes(q) ? 30 : tokens.every((t) => e.title.includes(t)) ? 20 : 10
    if (s) scored.push({ h: e.hymn, s })
  }
  return scored.sort((a, b) => b.s - a.s || a.h.n - b.h.n).map((x) => x.h)
}

export const azLetter = (h: Hymn): string => {
  const c = normalize(h.title)[0]?.toUpperCase() ?? '#'
  return /[A-Z]/.test(c) ? c : '#'
}
