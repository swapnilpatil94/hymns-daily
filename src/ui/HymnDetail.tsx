import { useCallback, useEffect, useRef, useState } from 'react'
import abcjs from 'abcjs'
import { alternatives, hymnByNumber } from '../data/hymns'
import { abcUrl, createPlayer, unlockAudio, type Player } from '../lib/audio'
import { verseLines } from '../lib/text'
import { Divider, PauseIcon, PlayIcon, roman } from './Ornament'
import { STORE_URL } from '../lib/ids'
import { useApp } from '../state'
import type { Hymn } from '../types'

async function share(h: Hymn): Promise<void> {
  const text = `${h.title}\n\n${verseLines(h.verses[0]).join('\n')}\n\nHymns Daily: ${STORE_URL}`
  if (navigator.share) await navigator.share({ title: h.title, text }).catch(() => {})
  else await navigator.clipboard?.writeText(text)
}

export function HymnDetail({ n, autoplay, onBack }: { n: number; autoplay: boolean; onBack(): void }) {
  const { data, setSettings, toggleFavourite, openHymn, audioPlaying } = useApp()
  const hymn = hymnByNumber(n)
  const { fontSize, instrument } = data.settings
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempo, setTempo] = useState(100)
  const [transpose, setTranspose] = useState(0)
  const [showMusic, setShowMusic] = useState(false)
  const abcRef = useRef<string | null>(null)
  const playerRef = useRef<Player | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  const loadAbc = useCallback(async (h: Hymn): Promise<string> => {
    abcRef.current ??= await (await fetch(abcUrl(h.abcFile))).text()
    return abcRef.current
  }, [])

  const dispose = useCallback(() => {
    playerRef.current?.dispose()
    playerRef.current = null
    audioPlaying.current = false
    setPlaying(false)
  }, [audioPlaying])

  const toggle = useCallback(async () => {
    if (!hymn) return
    unlockAudio() // must run synchronously inside the tap, before any await
    const p = playerRef.current
    if (p?.isPlaying()) { p.pause(); audioPlaying.current = false; setPlaying(false); return }
    try {
      setError('')
      if (p) { await p.play() } else {
        setLoading(true)
        const abc = await loadAbc(hymn)
        const np = await createPlayer({ abc, instrument, tempoPct: tempo, transpose, onEnd: () => { audioPlaying.current = false; setPlaying(false); playerRef.current = null } })
        playerRef.current = np
        await np.play()
      }
      audioPlaying.current = true
      setPlaying(true)
    } catch (e) {
      console.warn(e)
      setError('Audio could not start. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [hymn, instrument, tempo, transpose, loadAbc, audioPlaying])

  // Changing tempo/transpose/instrument/hymn rebuilds the synth on next Play.
  useEffect(() => dispose, [n, tempo, transpose, instrument, dispose])
  useEffect(() => { if (autoplay) void toggle() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sheet music is parsed/rendered lazily only when requested.
  useEffect(() => {
    if (!showMusic || !hymn || !sheetRef.current) return
    let cancelled = false
    void loadAbc(hymn).then((abc) => { if (!cancelled && sheetRef.current) abcjs.renderAbc(sheetRef.current, abc, { responsive: 'resize', add_classes: true }) })
    return () => { cancelled = true }
  }, [showMusic, hymn, loadAbc])

  if (!hymn) return <div className="screen pad"><button onClick={onBack}>Back</button><p>Hymn not found.</p></div>
  const fav = data.favourites.includes(n)
  const alts = alternatives(hymn)

  return (
    <div className="screen detail">
      <header className="bar">
        <button aria-label="Back" onClick={onBack}>←</button>
        <span className="bartitle">No. {hymn.n}</span>
        <button aria-label={fav ? 'Remove favourite' : 'Add favourite'} aria-pressed={fav} className={fav ? 'heart on' : 'heart'} onClick={() => toggleFavourite(n)}>{fav ? '♥' : '♡'}</button>
        <button aria-label="Share" onClick={() => void share(hymn)}>Share</button>
      </header>
      <div className="scroll pad">
        <h1>{hymn.title}</h1>
        <Divider />
        {alts.length > 0 && (
          <p className="muted">Tune: {hymn.tune}. Also set to: {alts.map((a) => <button key={a.n} className="link" onClick={() => openHymn(a.n)}>{a.tune}</button>)}</p>
        )}
        <section className="player" aria-label="Audio player">
          <button className={playing ? 'primary playbtn on' : 'primary playbtn'} disabled={loading} onClick={() => void toggle()}>{loading ? <span>…</span> : playing ? <PauseIcon /> : <PlayIcon />}<span className="sr">{loading ? 'Loading…' : playing ? 'Pause' : 'Play'}</span></button>
          <label>Tempo {tempo}%<input type="range" min={50} max={130} step={5} value={tempo} onChange={(e) => setTempo(+e.target.value)} /></label>
          <div className="transpose" role="group" aria-label="Transpose">
            <button aria-label="Down a semitone" disabled={transpose <= -3} onClick={() => setTranspose(transpose - 1)}>−</button>
            <span>Key {transpose > 0 ? `+${transpose}` : transpose}</span>
            <button aria-label="Up a semitone" disabled={transpose >= 3} onClick={() => setTranspose(transpose + 1)}>+</button>
          </div>
          <label>Text size<input type="range" min={16} max={36} value={fontSize} onChange={(e) => setSettings({ fontSize: +e.target.value })} /></label>
        </section>
        {error && <p role="alert" className="error">{error}</p>}
        <article className="lyrics" style={{ fontSize }}>
          {hymn.verses.map((v, i) => (
            <div key={i}>
              <p className="verse"><span className="vnum" aria-label={`Verse ${i + 1}`}>{roman(i + 1)}</span>{verseLines(v).map((l, j) => <span key={j} className="vline">{l}</span>)}</p>
              {hymn.refrain && <p className="refrain">{verseLines(hymn.refrain).map((l, j) => <span key={j} className="vline">{l}</span>)}</p>}
            </div>
          ))}
        </article>
        <button onClick={() => setShowMusic(!showMusic)}>{showMusic ? 'Hide music' : 'Show music'}</button>
        {showMusic && <div ref={sheetRef} className="sheet" />}
        <footer className="credits">
          {hymn.scripture && <p>Scripture: {hymn.scripture}</p>}
          <p>{hymn.credit.replace(/\s*This score is a part of.*$/, '')}</p>
          <p>Open Hymnal Project (public domain)</p>
        </footer>
      </div>
    </div>
  )
}
