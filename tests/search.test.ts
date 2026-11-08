import { describe, expect, it } from 'vitest'
import { buildIndex, search } from '../src/lib/search'
import { hymns, searchIndex } from '../src/data/hymns'
import { normalize } from '../src/lib/text'

describe('search', () => {
  it('has 245 hymns numbered 1..245', () => {
    expect(hymns).toHaveLength(245)
    expect(hymns.map((h) => h.n)).toEqual(Array.from({ length: 245 }, (_, i) => i + 1))
  })
  it('finds by title, ignoring case and punctuation', () => {
    expect(search(searchIndex, 'AMAZING   grace!')[0].title).toMatch(/Amazing Grace/i)
  })
  it('finds by words in the full text and first line', () => {
    expect(search(searchIndex, 'wretch like me').length).toBeGreaterThan(0)
  })
  it('finds by hymn number first', () => {
    expect(search(searchIndex, '7')[0].n).toBe(7)
  })
  it('is diacritic-insensitive', () => {
    expect(normalize('Café Müller, Ö!')).toBe('cafe muller o')
    const idx = buildIndex([{ ...hymns[0], title: 'Ein feste Burg ist unser Gött', verses: ['Naïve verse'], refrain: '' }])
    expect(search(idx, 'gott')).toHaveLength(1)
    expect(search(idx, 'naive')).toHaveLength(1)
  })
  it('filters by category and topic', () => {
    const xmas = search(searchIndex, '', { category: 'CHRISTMAS' })
    expect(xmas.length).toBe(24)
    const t = hymns[0].topics[0]
    expect(search(searchIndex, '', { topic: t }).every((h) => h.topics.includes(t))).toBe(true)
  })
  it('returns nothing for gibberish', () => {
    expect(search(searchIndex, 'zzzqqqxxx')).toEqual([])
  })
})
