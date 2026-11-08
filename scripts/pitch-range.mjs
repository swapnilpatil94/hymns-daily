// Computes the diatonic pitch range across all ABC files (0 = C4) to decide which soundfont notes to bundle.
import abcjs from 'abcjs'
import { readdirSync, readFileSync } from 'node:fs'
let lo = 99, hi = -99
for (const f of readdirSync('content/abc')) {
  const tunes = abcjs.parseOnly(readFileSync(`content/abc/${f}`, 'utf8'))
  for (const t of tunes) for (const l of t.lines) for (const s of l.staff ?? []) for (const v of s.voices) for (const e of v)
    for (const p of e.pitches ?? []) { lo = Math.min(lo, p.pitch); hi = Math.max(hi, p.pitch) }
}
console.log({ lo, hi })
