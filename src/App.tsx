import { useCallback, useEffect, useState } from 'react'
import { AppProvider, loadStore, useApp } from './state'
import { showBanner } from './lib/ads'
import type { Persisted } from './lib/store'
import { Today } from './ui/Today'
import { HymnList } from './ui/HymnList'
import { HymnDetail } from './ui/HymnDetail'
import { Favourites } from './ui/Favourites'
import { Settings } from './ui/Settings'
import { icons } from './ui/Ornament'

type Tab = 'today' | 'hymns' | 'favs' | 'settings'
const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' }, { id: 'hymns', label: 'Hymns' }, { id: 'favs', label: 'Saved' }, { id: 'settings', label: 'Settings' },
]
const TAB_BAR_DP = 64

interface Route { tab: Tab; hymn: number | null; autoplay: boolean }

function Shell({ route, setRoute }: { route: Route; setRoute(r: Route): void }) {
  const { data, adsEnabled } = useApp()
  const { theme } = data.settings
  const inDetail = route.hymn !== null
  const bannerScreen = inDetail || route.tab === 'hymns'

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  // Adaptive banner on list + detail only. Lyrics scroll inside a container padded by the banner height.
  useEffect(() => {
    if (!adsEnabled || !bannerScreen) return
    let off = () => {}
    let dead = false
    void showBanner(inDetail ? 0 : TAB_BAR_DP, (px) => document.documentElement.style.setProperty('--banner-h', `${px}px`)).then((f) => { if (dead) f(); else off = f })
    return () => { dead = true; off() }
  }, [adsEnabled, bannerScreen, inDetail])

  return (
    <div className="app">
      <main className="main">
        {inDetail ? (
          <HymnDetail key={route.hymn} n={route.hymn!} autoplay={route.autoplay} onBack={() => history.back()} />
        ) : route.tab === 'today' ? <Today />
        : route.tab === 'hymns' ? <HymnList />
        : route.tab === 'favs' ? <Favourites />
        : <Settings />}
      </main>
      {!inDetail && (
        <nav className="tabs" aria-label="Main">
          {TABS.map((t) => (
            <button key={t.id} aria-current={route.tab === t.id} onClick={() => setRoute({ tab: t.id, hymn: null, autoplay: false })}>{icons[t.id]}<span>{t.label}</span></button>
          ))}
        </nav>
      )}
    </div>
  )
}

export default function App() {
  const [initial, setInitial] = useState<Persisted | null>(null)
  const [route, setRoute] = useState<Route>({ tab: 'today', hymn: null, autoplay: false })

  useEffect(() => { void loadStore().then(setInitial) }, [])
  // Android hardware back / browser back leaves the hymn detail.
  useEffect(() => {
    const onPop = () => setRoute((r) => ({ ...r, hymn: null, autoplay: false }))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((n: number, autoplay: boolean) => {
    history.pushState({ hymn: n }, '')
    setRoute((r) => ({ tab: r.tab, hymn: n, autoplay }))
  }, [])

  if (!initial) return null
  return (
    <AppProvider initial={initial} onNavigate={navigate}>
      <Shell route={route} setRoute={setRoute} />
    </AppProvider>
  )
}
