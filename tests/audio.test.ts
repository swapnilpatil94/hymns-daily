import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PROGRAMS, SOUNDFONT_URL, withProgram } from '../src/lib/audio'

describe('audio is fully local', () => {
  it('soundfont URL is a local path, not http(s)', () => {
    expect(SOUNDFONT_URL).not.toMatch(/^(https?:)?\/\//)
    expect(SOUNDFONT_URL.endsWith('/')).toBe(true)
  })
  it('bundled sample folders exist for both instruments', () => {
    for (const dir of ['church_organ-mp3', 'acoustic_grand_piano-mp3']) {
      expect(readdirSync(join('public/soundfonts', dir)).filter((f) => f.endsWith('.mp3')).length).toBeGreaterThan(40)
    }
    expect(existsSync('public/soundfonts/church_organ-mp3/C4.mp3')).toBe(true)
  })
  it('source code has no remote soundfont URL', () => {
    const src = readFileSync('src/lib/audio.ts', 'utf8')
    expect(src).not.toMatch(/https?:\/\/[^\s'"`]*(soundfont|midi-js)/i)
  })
  it('forces the chosen MIDI program on every voice', () => {
    const abc = 'X:1\n%%MIDI program 1 0 % Piano 1\n%%MIDI program 2 0\nK:C\nC|'
    const out = withProgram(abc, PROGRAMS.organ)
    expect(out).toContain('%%MIDI program 1 19')
    expect(out).toContain('%%MIDI program 2 19')
    expect(out).not.toMatch(/program \d+ 0/)
  })
})
