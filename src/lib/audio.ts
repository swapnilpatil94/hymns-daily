import abcjs from 'abcjs'
import type { Instrument } from '../types'

/** Soundfont samples are bundled under public/soundfonts (copied to the app's local assets): no network at runtime. */
export const SOUNDFONT_URL = `${import.meta.env.BASE_URL}soundfonts/`
export const PROGRAMS: Record<Instrument, number> = { organ: 19, piano: 0 }
export const BASE_QPM = 90

/** Force every voice to the chosen General MIDI program (the source files default to piano). */
export function withProgram(abc: string, program: number): string {
  return abc.replace(/^%%MIDI program (?:\d+ )?\d+.*$/gm, (line) => {
    const ch = /^%%MIDI program (\d+) \d+/.exec(line)
    return `%%MIDI program ${ch ? ch[1] + ' ' : ''}${program}`
  })
}

export const abcUrl = (file: string): string => `${import.meta.env.BASE_URL}abc/${encodeURIComponent(file)}`

/**
 * Mobile browsers (iOS Safari/Chrome especially) keep Web Audio locked unless the AudioContext is
 * created/resumed synchronously inside a user gesture. Hymn files and ~54 samples load asynchronously
 * after the tap, so we unlock abcjs's shared context up front, inside the gesture.
 */
export function unlockAudio(): void {
  try {
    // iOS: treat page audio as media (plays with the silent switch on). Safari 17+; ignored elsewhere.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'playback'
    primeMediaChannel()
    const ctx = abcjs.synth.activeAudioContext()
    if (ctx.state !== 'running') void ctx.resume().catch(() => {})
    // A one-sample silent buffer played in the gesture fully unlocks output on iOS.
    const src = ctx.createBufferSource()
    src.buffer = ctx.createBuffer(1, 1, 22050)
    src.connect(ctx.destination)
    src.start(0)
  } catch { /* audio unsupported: createPlayer reports it */ }
}

let silentEl: HTMLAudioElement | undefined
/** Older iOS: playing any <audio> element moves the page to the media channel, so Web Audio ignores the silent switch. */
function primeMediaChannel(): void {
  if (silentEl) return
  const rate = 8000, n = 800 // 0.1 s of 8-bit silence
  const b = new Uint8Array(44 + n).fill(128)
  const dv = new DataView(b.buffer)
  const tag = (o: number, t: string) => [...t].forEach((c, i) => b[o + i] = c.charCodeAt(0))
  tag(0, 'RIFF'); dv.setUint32(4, 36 + n, true); tag(8, 'WAVE'); tag(12, 'fmt ')
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true)
  dv.setUint32(24, rate, true); dv.setUint32(28, rate, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true)
  tag(36, 'data'); dv.setUint32(40, n, true)
  silentEl = new Audio(URL.createObjectURL(new Blob([b], { type: 'audio/wav' })))
  silentEl.setAttribute('playsinline', '')
  void silentEl.play().catch(() => { silentEl = undefined })
}

/** Unlock on the first touch/click anywhere so every Play path (Today, list, detail, autoplay) is covered. */
export function installAudioUnlock(): void {
  const events = ['pointerdown', 'touchend', 'click', 'keydown'] as const
  const onGesture = () => {
    unlockAudio()
    if (abcjs.synth.activeAudioContext().state === 'running') events.forEach((e) => document.removeEventListener(e, onGesture, true))
  }
  events.forEach((e) => document.addEventListener(e, onGesture, { capture: true, passive: true }))
}

export interface Player {
  visualObj: abcjs.TuneObject
  play(): Promise<void>
  pause(): void
  stop(): void
  isPlaying(): boolean
  dispose(): void
}

export interface PlayerOptions {
  abc: string
  instrument: Instrument
  tempoPct: number // 50..130
  transpose: number // -3..3 semitones
  onEnd: () => void
}

/** Create a synth for one hymn. A new player is created whenever tempo/transpose/instrument change (cheap once samples are cached). */
export async function createPlayer(o: PlayerOptions): Promise<Player> {
  const [visualObj] = abcjs.parseOnly(withProgram(o.abc, PROGRAMS[o.instrument]))
  const synth = new abcjs.synth.CreateSynth()
  await synth.init({
    visualObj,
    options: {
      soundFontUrl: SOUNDFONT_URL, // local path, never http(s)
      soundFontVolumeMultiplier: 3, // abcjs/ sample set is mastered quiet; 3 matches abcjs's own default for it
      program: PROGRAMS[o.instrument],
      qpm: Math.round((BASE_QPM * o.tempoPct) / 100),
      midiTranspose: o.transpose,
      onEnded: o.onEnd,
    },
  })
  await synth.prime()
  let playing = false
  return {
    visualObj,
    async play() { playing = true; await synth.start() },
    pause() { playing = false; synth.pause() },
    stop() { playing = false; synth.stop() },
    isPlaying: () => playing,
    dispose() { playing = false; synth.stop() },
  }
}
