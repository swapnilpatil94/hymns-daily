import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { loadStore, saveStore, type Persisted } from './lib/store'
import { canShowInterstitial, registerOpen, registerShown } from './lib/adRules'
import { nextStreak } from './lib/rotation'
import { initAds, showInterstitial } from './lib/ads'
import { initBilling } from './lib/billing'
import type { Settings } from './types'

interface Ctx {
  data: Persisted
  setSettings(p: Partial<Settings>): void
  toggleFavourite(n: number): void
  openHymn(n: number, autoplay?: boolean): void
  setAdsRemoved(v: boolean): void
  audioPlaying: React.RefObject<boolean>
  adsEnabled: boolean
}

const AppCtx = createContext<Ctx | null>(null)
export const useApp = (): Ctx => {
  const c = useContext(AppCtx)
  if (!c) throw new Error('AppProvider missing')
  return c
}

export function AppProvider({ initial, onNavigate, children }: { initial: Persisted; onNavigate(n: number, autoplay: boolean): void; children: ReactNode }) {
  const [data, setData] = useState(initial)
  const [consented, setConsented] = useState(false)
  const audioPlaying = useRef(false)
  const dataRef = useRef(data)
  dataRef.current = data

  const update = useCallback((fn: (d: Persisted) => Persisted) => {
    const next = fn(dataRef.current)
    dataRef.current = next
    setData(next)
    void saveStore(next)
  }, [])

  // Launch: count the session, update the streak, run consent -> ads, then billing restore.
  useEffect(() => {
    update((d) => ({ ...d, ads: { ...d.ads, sessions: d.ads.sessions + 1 }, streak: nextStreak(d.streak, new Date()) }))
    void initAds().then(setConsented)
    // Entitlement is cached locally; only ever upgraded here so an offline launch never drops it.
    void initBilling((owned) => owned && update((d) => (d.adsRemoved ? d : { ...d, adsRemoved: true })))
  }, [update])

  const openHymn = useCallback((n: number, autoplay = false) => {
    const d = dataRef.current
    const now = Date.now()
    const ads = registerOpen(d.ads)
    const show = canShowInterstitial({ now, audioPlaying: audioPlaying.current, adsRemoved: d.adsRemoved, state: ads })
    update((x) => ({ ...x, ads, recents: [n, ...x.recents.filter((r) => r !== n)].slice(0, 30) }))
    onNavigate(n, autoplay)
    if (show) void showInterstitial().then((shown) => shown && update((x) => ({ ...x, ads: registerShown(x.ads, Date.now()) })))
  }, [update, onNavigate])

  const value = useMemo<Ctx>(() => ({
    data,
    setSettings: (p) => update((d) => ({ ...d, settings: { ...d.settings, ...p } })),
    toggleFavourite: (n) => update((d) => ({ ...d, favourites: d.favourites.includes(n) ? d.favourites.filter((f) => f !== n) : [n, ...d.favourites] })),
    openHymn,
    setAdsRemoved: (v) => update((d) => ({ ...d, adsRemoved: v })),
    audioPlaying,
    adsEnabled: consented && !data.adsRemoved && Date.now() >= data.ads.adFreeUntil,
  }), [data, update, openHymn, consented])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export { loadStore }
