// Post-build check: audio is local. Run after `npm run build`.
// abcjs ships three unused default soundfont URLs; we always override soundFontUrl, which tests/audio-runtime.test.ts proves.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist'
const js = readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dist, 'assets', f), 'utf8')).join('\n')
const ABCJS_UNUSED_DEFAULTS = [
  'https://paulrosen.github.io/midi-js-soundfonts/abcjs/',
  'https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/',
  'https://paulrosen.github.io/midi-js-soundfonts/MusyngKite/',
]
const remote = [...new Set(js.match(/https?:\/\/[^\s"'`)]*soundfont[^\s"'`)]*/gi) ?? [])]
const unexpected = remote.filter((u) => !ABCJS_UNUSED_DEFAULTS.includes(u))
const problems = []
if (unexpected.length) problems.push(`unexpected remote soundfont URLs: ${unexpected.join(', ')}`)
if (!js.includes('soundfonts/')) problems.push('local soundfonts/ path not found in bundle')
for (const dir of ['church_organ-mp3', 'acoustic_grand_piano-mp3']) {
  if (!existsSync(join(dist, 'soundfonts', dir, 'C4.mp3'))) problems.push(`missing dist/soundfonts/${dir}`)
}
if (!existsSync(join(dist, 'abc', 'Amazing_Grace-New_Britain.abc'))) problems.push('missing dist/abc')
if (problems.length) { console.error('FAIL\n' + problems.join('\n')); process.exit(1) }
console.log(`OK: audio assets bundled locally; ${remote.length} abcjs default URLs present but never used (overridden).`)
