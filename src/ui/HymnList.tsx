import { useDeferredValue, useMemo, useState } from 'react'
import { categories, hymns, searchIndex, topics } from '../data/hymns'
import { azLetter, search } from '../lib/search'
import { normalize } from '../lib/text'
import { HymnRow } from './HymnRow'
import { VirtualList } from './VirtualList'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const alpha = [...hymns].sort((a, b) => normalize(a.title).localeCompare(normalize(b.title)))

export function HymnList() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [topic, setTopic] = useState('')
  const [sort, setSort] = useState<'num' | 'az'>('num')
  const [jump, setJump] = useState<number | null>(null)
  const dq = useDeferredValue(q)

  const results = useMemo(() => {
    const found = search(searchIndex, dq, { category: category || undefined, topic: topic || undefined })
    if (dq.trim() || sort === 'num') return found
    const set = new Set(found)
    return alpha.filter((h) => set.has(h))
  }, [dq, category, topic, sort])

  const showIndex = sort === 'az' && !dq.trim()
  return (
    <div className="screen list">
      <div className="filters">
        <input type="search" inputMode="search" placeholder="Search title, first line, words, or number 1-245" aria-label="Search hymns" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">
          <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c.toLowerCase()}</option>)}
          </select>
          <select aria-label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">All topics</option>
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => setSort(sort === 'num' ? 'az' : 'num')}>{sort === 'num' ? '1-245' : 'A-Z'}</button>
        </div>
        <p className="muted count">{results.length} hymns</p>
      </div>
      <div className="listwrap">
        <VirtualList className="vlist" items={results} rowHeight={64} scrollToIndex={jump} render={(h) => <HymnRow hymn={h} />} />
        {showIndex && (
          <div className="azindex" aria-label="A to Z index">
            {LETTERS.map((l) => (
              <button key={l} onClick={() => { const i = results.findIndex((h) => azLetter(h) >= l); setJump(i < 0 ? results.length - 1 : i) ; setTimeout(() => setJump(null), 50) }}>{l}</button>
            ))}
          </div>
        )}
      </div>
      {results.length === 0 && <p className="empty">No hymns match. Try fewer words.</p>}
    </div>
  )
}
