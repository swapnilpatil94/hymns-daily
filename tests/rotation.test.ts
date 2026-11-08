import { describe, expect, it } from 'vitest'
import { dayKey, easterSunday, hymnOfDay, nextStreak, seasonalCategories } from '../src/lib/rotation'
import { hymns } from '../src/data/hymns'

describe('hymn of the day', () => {
  it('is deterministic for a date and varies across days', () => {
    const d = new Date(2026, 2, 3)
    expect(hymnOfDay(hymns, d).n).toBe(hymnOfDay(hymns, new Date(2026, 2, 3, 22)).n)
    const seen = new Set(Array.from({ length: 30 }, (_, i) => hymnOfDay(hymns, new Date(2026, 2, 3 + i)).n))
    expect(seen.size).toBeGreaterThan(20)
  })
  it('uses Advent/Christmas hymns in December', () => {
    for (let day = 1; day <= 31; day++) expect(['ADVENT', 'CHRISTMAS']).toContain(hymnOfDay(hymns, new Date(2026, 11, day)).category)
  })
  it('computes Easter and uses EASTER hymns around it', () => {
    expect(dayKey(easterSunday(2026))).toBe('2026-04-05')
    expect(dayKey(easterSunday(2027))).toBe('2027-03-28')
    expect(hymnOfDay(hymns, easterSunday(2026)).category).toBe('EASTER')
    expect(seasonalCategories(new Date(2026, 5, 15))).toBeNull()
  })
  it('keeps seasonal hymns out of the ordinary rotation', () => {
    for (let i = 0; i < 60; i++) expect(['ADVENT', 'CHRISTMAS', 'EASTER']).not.toContain(hymnOfDay(hymns, new Date(2026, 5, 1 + i)).category)
  })
})

describe('streak', () => {
  it('increments on consecutive days, resets after a gap, ignores same day', () => {
    const s1 = nextStreak({ last: '', count: 0 }, new Date(2026, 0, 1))
    expect(s1.count).toBe(1)
    expect(nextStreak(s1, new Date(2026, 0, 1))).toBe(s1)
    const s2 = nextStreak(s1, new Date(2026, 0, 2))
    expect(s2.count).toBe(2)
    expect(nextStreak(s2, new Date(2026, 0, 5)).count).toBe(1)
  })
})
