import raw from './hymns.json'
import versesRaw from './verses_web.json'
import type { Hymn, Verse } from '../types'
import { decodeEntities, formatVerse } from '../lib/text'
import { buildIndex } from '../lib/search'

interface RawHymn {
  n: number; id: string; file: string; abc_file: string; title: string; credit: string; author: string; composer: string
  category: string; topics: string[]; scripture: string; meter: string; verses: string[]; refrain: string
}

const tuneName = (r: RawHymn): string => {
  const base = r.abc_file.replace(/\.abc$/, '')
  const t = base.startsWith(`${r.id}-`) ? base.slice(r.id.length + 1) : base
  return t.replace(/_/g, ' ')
}

export const hymns: Hymn[] = (raw as RawHymn[])
  .map((r) => ({
    n: r.n, id: r.id, tune: tuneName(r), title: decodeEntities(r.title), credit: decodeEntities(r.credit),
    author: decodeEntities(r.author), composer: decodeEntities(r.composer), category: r.category,
    topics: r.topics.map(decodeEntities), scripture: r.scripture, meter: r.meter,
    verses: r.verses.map(formatVerse), refrain: formatVerse(r.refrain), abcFile: r.abc_file,
  }))
  .sort((a, b) => a.n - b.n)

export const verses: Verse[] = versesRaw as Verse[]
export const searchIndex = buildIndex(hymns)
export const categories = [...new Set(hymns.map((h) => h.category))].sort()
export const topics = [...new Set(hymns.flatMap((h) => h.topics))].sort()
export const hymnByNumber = (n: number): Hymn | undefined => hymns.find((h) => h.n === n)
/** Other settings of the same hymn text with a different tune. */
export const alternatives = (h: Hymn): Hymn[] => hymns.filter((x) => x.id === h.id && x.n !== h.n)
export const duplicateIds = new Set(hymns.filter((h) => alternatives(h).length).map((h) => h.id))
