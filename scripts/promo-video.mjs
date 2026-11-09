// Play Store promo video (1920x1080, ~40 s): real app screens + captions, soundtrack = the app's own organ
// playing "Amazing Grace" (New Britain, public domain) rendered offline with abcjs + the bundled soundfont.
// Usage: npm run build && node scripts/promo-video.mjs   -> store/video/hymns-daily-promo.mp4
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import puppeteer from 'puppeteer-core'

const port = 4178, base = `http://localhost:${port}/`
const work = resolve('store/.raw/video'); mkdirSync(work, { recursive: true }); mkdirSync('store/video', { recursive: true })
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 2500))
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] })
try {
  // 1. Soundtrack: render the hymn to WAV inside the app's origin (same soundfont the app uses).
  const page = await browser.newPage()
  await page.setBypassCSP(true)
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.addScriptTag({ path: resolve('node_modules/abcjs/dist/abcjs-basic-min.js') })
  const b64 = await page.evaluate(async () => {
    const abc = (await (await fetch('/abc/Amazing_Grace-New_Britain.abc')).text()).replace(/^%%MIDI program (?:\d+ )?\d+.*$/gm, '%%MIDI program 19')
    const [visualObj] = window.ABCJS.parseOnly(abc)
    const synth = new window.ABCJS.synth.CreateSynth()
    await synth.init({ visualObj, options: { soundFontUrl: '/soundfonts/', program: 19, qpm: 76, soundFontVolumeMultiplier: 3 } })
    await synth.prime()
    const buf = await (await fetch(synth.download())).arrayBuffer()
    let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000))
    return btoa(s)
  })
  writeFileSync(`${work}/hymn.wav`, Buffer.from(b64, 'base64'))

  // 2. Scenes (1920x1080 stills): caption on the left, real app screen in a phone frame on the right.
  const fonts = (f) => 'file://' + resolve('node_modules/@fontsource', f)
  const icon = readFileSync('resources/brand/icon.svg', 'utf8').replace('<g id="bgl">', '<g id="bgl" style="display:none">')
  const css = `@font-face{font-family:Cinzel;src:url(${fonts('cinzel/files/cinzel-latin-600-normal.woff2')})}
@font-face{font-family:Corm;font-style:italic;src:url(${fonts('cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2')})}
body{margin:0}.s{width:1920px;height:1080px;position:relative;overflow:hidden;color:#f2e8cf;background:radial-gradient(55% 70% at 70% 45%,rgba(243,213,132,.20),transparent 70%),linear-gradient(180deg,#1d1640,#0b0a16)}
.t{position:absolute;left:150px;top:0;bottom:0;width:820px;display:flex;flex-direction:column;justify-content:center}
h1{font-family:Cinzel;font-weight:600;font-size:86px;line-height:1.12;letter-spacing:.03em;margin:0;color:#f3d584}
p{font-family:Corm;font-style:italic;font-size:52px;margin:30px 0 0;color:#d9cba6}
.ph{position:absolute;right:230px;top:70px;width:430px;height:930px;border-radius:44px;overflow:hidden;border:3px solid rgba(223,188,102,.8);box-shadow:0 0 120px -10px rgba(243,213,132,.35),0 30px 80px rgba(0,0,0,.6)}
.ph img{width:100%;display:block}.c{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center}
.c svg{width:330px;height:330px}.c h1{font-size:110px;letter-spacing:.14em;margin-top:10px}`
  const scenes = [
    { c: true, h: 'HYMNS DAILY', p: 'Classic hymns with music, offline' },
    { img: '1-music', h: 'Every hymn plays with music', p: 'Church organ or piano · tempo & key' },
    { img: '2-today', h: 'A hymn for every day', p: 'Hymn of the day and a Bible verse' },
    { img: '3-search', h: 'Find any hymn in seconds', p: 'Title, words or hymn number' },
    { img: '4-lyrics', h: 'Large, clear lyrics', p: 'Parchment by day, candlelight by night' },
    { img: '5-sheet', h: 'Sing from the sheet music', p: 'Four-part harmony for choirs' },
    { img: '6-offline', h: '100% offline. No sign-up.', p: 'Your favourites stay on your phone' },
    { c: true, h: 'HYMNS DAILY', p: 'Free on Google Play' },
  ]
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
  for (const [i, s] of scenes.entries()) {
    const body = s.c ? `<div class="c">${icon}<h1>${s.h}</h1><p>${s.p}</p></div>` : `<div class="t"><h1>${s.h}</h1><p>${s.p}</p></div><div class="ph"><img src="file://${resolve('store/.raw', s.img + '.png')}"></div>`
    writeFileSync(`${work}/s${i}.html`, `<html><head><style>${css}</style></head><body><div class="s">${body}</div></body></html>`)
    await page.goto(`file://${work}/s${i}.html`, { waitUntil: 'networkidle0' }); await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: `${work}/s${i}.png` })
  }

  // 3. Assemble: slow push-in per scene, crossfades, hymn soundtrack with fade out.
  const D = [3.8, 4.2, 4.2, 4.2, 4.2, 4.2, 4.2, 5], X = 0.8, fps = 30
  const args = ['-y']
  scenes.forEach((_, i) => args.push('-loop', '1', '-t', String(D[i]), '-i', `${work}/s${i}.png`))
  args.push('-i', `${work}/hymn.wav`)
  let f = scenes.map((_, i) => `[${i}:v]scale=3840:-2,zoompan=z='min(zoom+0.0005,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(D[i] * fps)}:s=1920x1080:fps=${fps},format=yuv420p,setsar=1[v${i}]`).join(';')
  let prev = 'v0', t = D[0]
  for (let i = 1; i < scenes.length; i++) { t -= X; f += `;[${prev}][v${i}]xfade=transition=fade:duration=${X}:offset=${t.toFixed(2)}[x${i}]`; prev = `x${i}`; t += D[i] }
  const total = t
  f += `;[${scenes.length}:a]atrim=0:${total.toFixed(2)},afade=t=in:d=1,afade=t=out:st=${(total - 2.5).toFixed(2)}:d=2.5,volume=1.2[a]`
  args.push('-filter_complex', f, '-map', `[${prev}]`, '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-t', total.toFixed(2), '-movflags', '+faststart', 'store/video/hymns-daily-promo.mp4')
  execFileSync('ffmpeg', args, { stdio: 'ignore' })
  console.log(`promo video: store/video/hymns-daily-promo.mp4 (${total.toFixed(1)} s)`)
} finally { await browser.close(); server.kill() }
