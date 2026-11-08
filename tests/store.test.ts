import { describe, expect, it } from 'vitest'
import { defaults, sanitize } from '../src/lib/store'

describe('sanitize (untrusted persisted data)', () => {
  it('returns defaults for non-objects', () => {
    for (const bad of [null, undefined, 5, 'x', [], true]) expect(sanitize(bad)).toEqual(defaults)
  })
  it('coerces hostile and corrupt fields', () => {
    const out = sanitize({
      settings: { theme: '<script>', fontSize: 'big', reminder: '99:99', instrument: 'kazoo' },
      favourites: [1, 1, -4, 'a', 2.5, 7, 1e12, null],
      recents: 'nope',
      streak: { last: 'yesterday', count: -9 },
      ads: { sessions: NaN, lastAdAt: Infinity, adFreeUntil: '5' },
      adsRemoved: 'true',
    })
    expect(out.settings).toEqual(defaults.settings)
    expect(out.favourites).toEqual([1, 7])
    expect(out.recents).toEqual([])
    expect(out.streak).toEqual({ last: '', count: 0 })
    expect(out.ads).toEqual(defaults.ads)
    expect(out.adsRemoved).toBe(false)
  })
  it('keeps valid data and clamps ranges', () => {
    const out = sanitize({ settings: { theme: 'dark', fontSize: 999, reminder: '07:30', instrument: 'piano' }, favourites: [3, 4], adsRemoved: true })
    expect(out.settings).toEqual({ theme: 'dark', fontSize: 40, reminder: '07:30', instrument: 'piano' })
    expect(out.favourites).toEqual([3, 4])
    expect(out.adsRemoved).toBe(true)
  })
  it('caps list sizes', () => {
    expect(sanitize({ favourites: Array.from({ length: 2000 }, (_, i) => i + 1) }).favourites).toHaveLength(500)
  })
})
