import { describe, expect, it } from 'vitest'
import { bannersAllowed, canShowInterstitial, registerOpen, registerShown } from '../src/lib/adRules'
import type { AdState } from '../src/types'

const base: AdState = { sessions: 2, opensSinceAd: 4, lastAdAt: 0, adFreeUntil: 0 }
const ctx = (over: Partial<Parameters<typeof canShowInterstitial>[0]> = {}) => ({ now: 10_000_000, audioPlaying: false, adsRemoved: false, state: base, ...over })

describe('interstitial frequency rules', () => {
  it('shows on the 4th open when eligible', () => expect(canShowInterstitial(ctx())).toBe(true))
  it('needs 4 opens', () => expect(canShowInterstitial(ctx({ state: { ...base, opensSinceAd: 3 } }))).toBe(false))
  it('needs 3 minutes since the last one', () => {
    const state = { ...base, lastAdAt: 10_000_000 - 179_000 }
    expect(canShowInterstitial(ctx({ state }))).toBe(false)
    expect(canShowInterstitial(ctx({ state: { ...base, lastAdAt: 10_000_000 - 180_000 } }))).toBe(true)
  })
  it('never while audio plays', () => expect(canShowInterstitial(ctx({ audioPlaying: true }))).toBe(false))
  it('never in the first session', () => expect(canShowInterstitial(ctx({ state: { ...base, sessions: 1 } }))).toBe(false))
  it('never when ads are removed or an ad-free window is active', () => {
    expect(canShowInterstitial(ctx({ adsRemoved: true }))).toBe(false)
    expect(canShowInterstitial(ctx({ state: { ...base, adFreeUntil: 10_000_001 } }))).toBe(false)
    expect(bannersAllowed(true, 0, 1)).toBe(false)
    expect(bannersAllowed(false, 5, 1)).toBe(false)
    expect(bannersAllowed(false, 0, 1)).toBe(true)
  })
  it('simulates a session: one ad per 4 opens', () => {
    let s: AdState = { sessions: 2, opensSinceAd: 0, lastAdAt: 0, adFreeUntil: 0 }
    let shown = 0
    for (let i = 1; i <= 12; i++) {
      s = registerOpen(s)
      const now = i * 60_000 * 4 // 4 min per open
      if (canShowInterstitial({ now, audioPlaying: false, adsRemoved: false, state: s })) { shown++; s = registerShown(s, now) }
    }
    expect(shown).toBe(3)
  })
})
