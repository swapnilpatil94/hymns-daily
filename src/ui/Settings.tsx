import { useState } from 'react'
import { openPrivacyOptions } from '../lib/ads'
import { buyRemoveAds, priceOfRemoveAds, restorePurchases } from '../lib/billing'
import { PRIVACY_POLICY_URL, STORE_URL } from '../lib/ids'
import { setDailyReminder } from '../lib/reminder'
import { WEB_ATTRIBUTION } from '../lib/text'
import { useApp } from '../state'
import type { Instrument, ThemePref } from '../types'

export function Settings() {
  const { data, setSettings } = useApp()
  const { theme, fontSize, reminder, instrument } = data.settings
  const [msg, setMsg] = useState('')
  const [about, setAbout] = useState(false)

  const changeReminder = async (time: string | null) => {
    const ok = await setDailyReminder(time)
    if (ok) { setSettings({ reminder: time }); setMsg(time ? `Daily reminder set for ${time}.` : 'Reminder off.') }
    else setMsg('Notification permission was not granted.')
  }

  return (
    <div className="screen pad settings">
      <h1>Settings</h1>
      <label>Theme
        <select value={theme} onChange={(e) => setSettings({ theme: e.target.value as ThemePref })}>
          <option value="system">System</option><option value="light">Parchment (day)</option><option value="dark">Candlelight (night)</option>
        </select>
      </label>
      <label>Instrument
        <select value={instrument} onChange={(e) => setSettings({ instrument: e.target.value as Instrument })}>
          <option value="organ">Church organ</option><option value="piano">Piano</option>
        </select>
      </label>
      <label>Text size ({fontSize}px)
        <input type="range" min={16} max={36} value={fontSize} onChange={(e) => setSettings({ fontSize: +e.target.value })} />
      </label>
      <p className="sample" style={{ fontSize }}>Amazing grace, how sweet the sound</p>
      <label className="inline">
        <input type="checkbox" checked={reminder !== null} onChange={(e) => void changeReminder(e.target.checked ? reminder ?? '08:00' : null)} />
        Daily reminder
      </label>
      {reminder !== null && <label>Reminder time<input type="time" value={reminder} onChange={(e) => e.target.value && void changeReminder(e.target.value)} /></label>}

      <h2>Ads and purchases</h2>
      {data.adsRemoved ? <p>Thank you! Ads are removed.</p> : (
        <button className="primary" onClick={() => void buyRemoveAds().then((m) => m && setMsg(m))}>Remove ads{priceOfRemoveAds() ? ` (${priceOfRemoveAds()})` : ''}</button>
      )}
      <button onClick={() => void restorePurchases().then(setMsg)}>Restore purchase</button>
      <button onClick={() => void openPrivacyOptions().catch(() => setMsg('Privacy options are available in the Android app.'))}>Privacy options</button>

      <h2>About</h2>
      <a href={PRIVACY_POLICY_URL} target="_blank" rel="noreferrer">Privacy policy</a>
      <button onClick={() => window.open(STORE_URL, '_blank', 'noopener,noreferrer')}>Rate app</button>
      <button onClick={() => setAbout(!about)}>{about ? 'Hide about' : 'About'}</button>
      {about && (
        <div className="card">
          <p>Hymns Daily: Hymn Book Offline</p>
          <p>Hymn texts and music: Open Hymnal Project (public domain)</p>
          <p>Scripture: World English Bible. {WEB_ATTRIBUTION}</p>
          <p>Instrument samples: FluidR3_GM soundfont by Frank Wen, via midi-js-soundfonts. Licensed CC BY 3.0 (creativecommons.org/licenses/by/3.0).</p>
          <p>Fonts: Cinzel, Cormorant Garamond and EB Garamond, licensed SIL OFL 1.1.</p>
          <p>Works fully offline. No account, no analytics.</p>
        </div>
      )}
      {msg && <p role="status" className="muted">{msg}</p>}
    </div>
  )
}
