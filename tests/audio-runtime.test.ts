import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Runtime assertion: priming the real abcjs synth for several hymns (both instruments, transposed)
 * only requests soundfont files that are local and exist in public/. Browser audio APIs are stubbed.
 */
const requested: string[] = []

class FakeXHR {
  responseType = ''
  status = 200
  response = new ArrayBuffer(8)
  onload: () => void = () => {}
  onerror: () => void = () => {}
  open(_m: string, url: string) { requested.push(url) }
  send() { queueMicrotask(() => this.onload()) }
}
class FakeCtx {
  state = 'running'
  sampleRate = 44100
  currentTime = 0
  destination = {}
  decodeAudioData(_b: ArrayBuffer, ok: (b: unknown) => void) { const b = { duration: 1, length: 1, numberOfChannels: 1, getChannelData: () => new Float32Array(1) }; ok(b); return Promise.resolve(b) }
  createBuffer(c: number, l: number) { const data = [new Float32Array(l), new Float32Array(l)]; return { duration: l / 44100, length: l, numberOfChannels: c, getChannelData: (i: number) => data[i] ?? data[0], copyToChannel() {} } }
  createBufferSource() { return { connect() {}, start() {}, stop() {}, buffer: null, playbackRate: { value: 1 } } }
  createGain() { return { connect() {}, gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} } } }
  resume() { return Promise.resolve() }
  close() { return Promise.resolve() }
  suspend() { return Promise.resolve() }
}

class FakeOffline extends FakeCtx {
  oncomplete: (e: { renderedBuffer: unknown }) => void = () => {}
  constructor(public channels: number, public length: number) { super() }
  startRendering() { queueMicrotask(() => this.oncomplete({ renderedBuffer: this.createBuffer(this.channels, this.length) })) }
}

beforeAll(() => {
  vi.stubGlobal('OfflineAudioContext', FakeOffline)
  vi.stubGlobal('window', globalThis)
  vi.stubGlobal('XMLHttpRequest', FakeXHR)
  vi.stubGlobal('AudioContext', FakeCtx)
  vi.stubGlobal('webkitAudioContext', FakeCtx)
})
afterAll(() => vi.unstubAllGlobals())

describe('no network at audio runtime', () => {
  it('only requests local, bundled sample files', async () => {
    const { createPlayer } = await import('../src/lib/audio')
    for (const [file, instrument, transpose] of [
      ['Amazing_Grace-New_Britain.abc', 'organ', 0],
      ['Abide_With_Me-Eventide.abc', 'piano', 3],
      ['A_Mighty_Fortress_Is_Our_God-Ein_Feste_Burg_Isorhythmic.abc', 'organ', -3],
    ] as const) {
      const p = await createPlayer({ abc: readFileSync(join('public/abc', file), 'utf8'), instrument, tempoPct: 100, transpose, onEnd: () => {} })
      p.dispose()
    }
    expect(requested.length).toBeGreaterThan(10)
    for (const url of requested) {
      expect(url).not.toMatch(/^(https?:)?\/\//)
      expect(existsSync(join('public', url.replace(/^\//, '')))).toBe(true)
    }
  })

  // ~70 s: run with `npm run test:sweep`
  it.skipIf(!process.env.FULL_SWEEP)('every hymn at both transpose extremes only needs bundled samples', async () => {
    const { createPlayer } = await import('../src/lib/audio')
    const { readdirSync } = await import('node:fs')
    requested.length = 0
    for (const f of readdirSync('public/abc')) {
      const abc = readFileSync(join('public/abc', f), 'utf8')
      for (const [instrument, transpose] of [['organ', -3], ['organ', 3], ['piano', -3], ['piano', 3]] as const) {
        ;(await createPlayer({ abc, instrument, tempoPct: 100, transpose, onEnd: () => {} })).dispose()
      }
    }
    const missing = [...new Set(requested)].filter((u) => /^(https?:)?\/\//.test(u) || !existsSync(join('public', u.replace(/^\//, ''))))
    expect(missing).toEqual([])
  }, 120_000)
})
