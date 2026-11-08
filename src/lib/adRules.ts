import type { AdState } from '../types'

export const INTERSTITIAL_EVERY_N_OPENS = 4
export const INTERSTITIAL_MIN_GAP_MS = 3 * 60_000

export interface AdContext {
  now: number
  audioPlaying: boolean
  adsRemoved: boolean
  state: AdState
}

/**
 * Interstitial policy: every 4th hymn open, >=3 min since the last one,
 * never while audio plays, never in the first session, never when ads are removed / ad-free window active.
 */
export function canShowInterstitial({ now, audioPlaying, adsRemoved, state }: AdContext): boolean {
  if (adsRemoved || audioPlaying) return false
  if (state.sessions <= 1) return false
  if (now < state.adFreeUntil) return false
  if (state.opensSinceAd < INTERSTITIAL_EVERY_N_OPENS) return false
  return now - state.lastAdAt >= INTERSTITIAL_MIN_GAP_MS
}

export const registerOpen = (s: AdState): AdState => ({ ...s, opensSinceAd: s.opensSinceAd + 1 })
export const registerShown = (s: AdState, now: number): AdState => ({ ...s, opensSinceAd: 0, lastAdAt: now })
export const bannersAllowed = (adsRemoved: boolean, adFreeUntil: number, now: number): boolean => !adsRemoved && now >= adFreeUntil
