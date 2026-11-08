export interface Hymn {
  n: number
  id: string
  tune: string
  title: string
  credit: string
  author: string
  composer: string
  category: string
  topics: string[]
  scripture: string
  meter: string
  verses: string[]
  refrain: string
  abcFile: string
}

export interface Verse {
  ref: string
  text: string
}

export type ThemePref = 'light' | 'dark' | 'system'
export type Instrument = 'organ' | 'piano'

export interface Settings {
  theme: ThemePref
  fontSize: number
  reminder: string | null // "HH:MM" local time, null = off
  instrument: Instrument
}

export interface AdState {
  sessions: number
  opensSinceAd: number
  lastAdAt: number // epoch ms, 0 = never
  adFreeUntil: number // epoch ms (optional rewarded 24h)
}
