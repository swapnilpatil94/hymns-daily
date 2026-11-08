import { describe, expect, it } from 'vitest'
import { formatRef, formatVerse, verseLines, WEB_ATTRIBUTION } from '../src/lib/text'
import { verses } from '../src/data/hymns'

describe('verse formatting', () => {
  it('formats references', () => {
    expect(formatRef('1corinthians 13:4')).toBe('1 Corinthians 13:4')
    expect(formatRef('2timothy 1:7')).toBe('2 Timothy 1:7')
    expect(formatRef('john 3:16')).toBe('John 3:16')
    expect(formatRef('psalms 23:1')).toBe('Psalms 23:1')
  })
  it('formats every bundled verse reference as Title Case with optional numeral', () => {
    for (const v of verses) expect(formatRef(v.ref)).toMatch(/^(\d )?[A-Z][a-z]+( of [A-Z][a-z]+)? \d+:\d+/)
  })
  it('fixes spacing and entities in hymn text', () => {
    expect(formatVerse('coffers are full,He has  riches &amp; more')).toBe('coffers are full, He has riches & more')
  })
  it('splits into lines at clause boundaries', () => {
    expect(verseLines('My Father is rich, He holdeth the wealth!').length).toBeGreaterThan(1)
  })
  it('exposes the WEB attribution string', () => {
    expect(WEB_ATTRIBUTION).toBe('World English Bible (Public Domain)')
  })
})
