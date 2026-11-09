import { useMemo, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { hymns, verses } from '../data/hymns'
import { hymnOfDay, verseOfDay } from '../lib/rotation'
import { WEB_ATTRIBUTION, formatRef, verseLines } from '../lib/text'
import { useApp } from '../state'
import { Cross, Divider } from './Ornament'

/** Website-only intro video. Not rendered in the Android app (the file is not even bundled there).
 * Pages serves it without byte-range support, which iPhone Safari needs for <video src>, so on tap we
 * fetch the ~2 MB file ourselves and play it from a blob: URL (allowed by the CSP media-src). */
function WebPromo() {
  const [src, setSrc] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)
  if (Capacitor.isNativePlatform()) return null
  const load = async () => {
    setBusy(true); setErr(false)
    try {
      const r = await fetch('/promo/hymns-daily-promo.mp4')
      if (!r.ok) throw new Error(String(r.status))
      setSrc(URL.createObjectURL(await r.blob()))
      setTimeout(() => void ref.current?.play().catch(() => {}), 50)
    } catch { setErr(true) } finally { setBusy(false) }
  }
  return (
    <section className="webpromo" aria-label="Hymns Daily introduction video">
      {src ? (
        <video ref={ref} controls playsInline src={src} poster="/promo/poster.jpg" />
      ) : (
        <button className="promoposter" onClick={() => void load()} disabled={busy} aria-label="Play the introduction video">
          <img src="/promo/poster.jpg" alt="" />
          <span className="promoplay">{busy ? '…' : '▶'}</span>
        </button>
      )}
      {err && <p className="muted" role="alert">The video could not load. Please try again.</p>}
      <p className="muted">Android app coming soon to Google Play. This site works offline too: add it to your home screen.</p>
    </section>
  )
}

export function Today() {
  const { openHymn, data } = useApp()
  const { hymn, verse } = useMemo(() => {
    const d = new Date()
    return { hymn: hymnOfDay(hymns, d), verse: verseOfDay(verses, d) }
  }, [])
  const streak = data.streak.count
  return (
    <div className="screen pad">
      <header className="hero">
        <Cross />
        <h1>Hymns Daily</h1>
        <p className="tagline">Come, and sing in the light</p>
        <p className="muted streak" aria-live="polite">{streak > 0 ? `${streak}-day streak` : 'Welcome'}</p>
      </header>
      <WebPromo />
      <Divider />
      <section className="card hymncard">
        <h2 className="eyebrow">Hymn of the Day</h2>
        <h3>{hymn.title}</h3>
        <p className="muted">{hymn.category.toLowerCase()} · No. {hymn.n}</p>
        <p className="preview">{verseLines(hymn.verses[0]).slice(0, 2).join(' ')}</p>
        <div className="actions">
          <button className="primary" onClick={() => openHymn(hymn.n, true)}>Play</button>
          <button onClick={() => openHymn(hymn.n)}>Read</button>
        </div>
      </section>
      <section className="window">
        <h2 className="eyebrow">Verse of the Day</h2>
        <blockquote>{verse.text}</blockquote>
        <p className="muted">{formatRef(verse.ref)} · {WEB_ATTRIBUTION}</p>
      </section>
    </div>
  )
}
