import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { hymns, verses } from '../src/data/hymns'
import { formatRef, formatVerse } from '../src/lib/text'

describe('bundled content integrity', () => {
  it('has 245 hymns with unique sequential numbers', () => {
    expect(hymns).toHaveLength(245)
    expect(hymns.map((h) => h.n)).toEqual(Array.from({ length: 245 }, (_, i) => i + 1))
  })
  it('every hymn has real verses and an existing ABC file', () => {
    for (const h of hymns) {
      expect(h.verses.length, `${h.n} ${h.title}`).toBeGreaterThan(0)
      for (const v of h.verses) expect(v.length, `${h.n} ${h.title}`).toBeGreaterThan(15)
      expect(existsSync(`public/abc/${h.abcFile}`), `${h.abcFile}`).toBe(true)
    }
  })
  it('no ABC notation residue remains in displayed text', () => {
    for (const h of hymns) {
      for (const t of [...h.verses, h.refrain, h.title]) {
        expect(t, `${h.n} ${h.title}`).not.toMatch(/[_*|~\\]|\w- \w|\s-\s|&\w+;/)
      }
    }
  })
  it('every hymn is within the copyright clearance window (words/music credited 1930 or earlier)', () => {
    for (const h of hymns) {
      const years = [...h.credit.matchAll(/\b(1[0-9]{3})\b/g)].map((m) => +m[1])
      if (years.length) expect(Math.max(...years), `${h.n} ${h.title}`).toBeLessThanOrEqual(1930)
    }
  })
  it('verses are well-formed and refs format', () => {
    expect(verses.length).toBeGreaterThanOrEqual(140)
    for (const v of verses) { expect(v.text.length).toBeGreaterThan(10); expect(formatRef(v.ref)).toMatch(/^\d? ?[A-Z][a-z]+( of [A-Z][a-z]+)? \d+:\d+$/) }
  })
  it('text cleaner fixes known source quirks', () => {
    expect(formatVerse('heavy\\- hearted, W')).toContain('heavy-hearted')
    expect(formatVerse('given- Source of triumph')).toBe('given — Source of triumph')
    expect(formatVerse('Ho- ly, i- dol, clean- sing')).toBe('Holy, idol, cleansing')
    expect(formatVerse('our_ soul')).toBe('our soul')
  })
})
