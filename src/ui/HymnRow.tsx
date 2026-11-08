import type { Hymn } from '../types'
import { duplicateIds } from '../data/hymns'
import { useApp } from '../state'

export function HymnRow({ hymn }: { hymn: Hymn }) {
  const { openHymn, data } = useApp()
  const fav = data.favourites.includes(hymn.n)
  return (
    <button className="row" onClick={() => openHymn(hymn.n)}>
      <span className="num">{hymn.n}</span>
      <span className="rowtext">
        <span className="rowtitle">{hymn.title}</span>
        <span className="rowsub">{duplicateIds.has(hymn.id) ? `Tune: ${hymn.tune}` : hymn.category.toLowerCase()}</span>
      </span>
      {fav && <span aria-label="Favourite" className="heart">♥</span>}
    </button>
  )
}
