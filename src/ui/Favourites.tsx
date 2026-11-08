import { hymnByNumber } from '../data/hymns'
import { useApp } from '../state'
import { HymnRow } from './HymnRow'
import type { Hymn } from '../types'

const toHymns = (ns: number[]): Hymn[] => ns.map(hymnByNumber).filter((h): h is Hymn => !!h)

export function Favourites() {
  const { data } = useApp()
  const favs = toHymns(data.favourites)
  const recents = toHymns(data.recents)
  return (
    <div className="screen pad">
      <h1>Favourites</h1>
      {favs.length ? favs.map((h) => <HymnRow key={h.n} hymn={h} />) : <p className="empty">Tap the heart on a hymn to save it here.</p>}
      <h1>Recently viewed</h1>
      {recents.length ? recents.map((h) => <HymnRow key={h.n} hymn={h} />) : <p className="empty">Hymns you open will appear here.</p>}
    </div>
  )
}
