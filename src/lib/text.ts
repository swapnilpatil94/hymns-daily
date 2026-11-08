const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }

export const decodeEntities = (s: string): string => s.replace(/&(?:amp|lt|gt|quot|nbsp|#39);/g, (m) => ENTITIES[m] ?? m)

/** Tidy a raw verse/refrain string: decode entities, fix spacing after punctuation, collapse whitespace. */
export function formatVerse(raw: string): string {
  return decodeEntities(raw)
    // Leftovers from the ABC lyric source: stray syllable markers and dashes written as "word- Word" or "word\-word".
    .replace(/[_*|~]/g, '')
    .replace(/heavy\\-\s*hearted/g, 'heavy-hearted')
    .replace(/(\w)\\-\s*/g, '$1 — ')
    .replace(/\b(Ho|i|clean)- (ly|dol|sing)\b/g, '$1$2')
    .replace(/(\w)- (?=[A-Z])/g, '$1 — ')
    .replace(/\s+/g, ' ')
    .replace(/([,;:!?.])(?=[A-Za-z])/g, '$1 ')
    .replace(/\s+([,;:!?.])/g, '$1')
    .trim()
}

/** Split a verse into display lines at sentence/clause punctuation followed by a capital letter (hymn line starts). */
export function verseLines(raw: string): string[] {
  return formatVerse(raw)
    .split(/(?<=[,;:!?.])\s+(?=[A-Z])/)
    .map((l) => l.trim())
    .filter(Boolean)
}

/** "1corinthians 13:4" -> "1 Corinthians 13:4"; "psalms 23:1" -> "Psalms 23:1". */
export function formatRef(ref: string): string {
  const m = /^(\d?)\s*([a-z]+(?:\s+of\s+[a-z]+)?)\s+(.+)$/i.exec(ref.trim())
  if (!m) return ref
  const [, num, book, rest] = m
  const name = book
    .split(/\s+/)
    .map((w) => (w === 'of' ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ')
  return `${num ? num + ' ' : ''}${name} ${rest}`
}

export const WEB_ATTRIBUTION = 'World English Bible (Public Domain)'

/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function normalize(s: string): string {
  return decodeEntities(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
