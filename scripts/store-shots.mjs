// Play Store screenshots (1080x1920, 9:16) with captions, rendered from the real app UI, plus the 1024x500 feature graphic.
// Usage: npm run build && node scripts/store-shots.mjs   -> store/screenshots/*.png, store/feature-graphic.png
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import puppeteer from 'puppeteer-core'

const port = 4176, base = `http://localhost:${port}/`
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 2500))
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] })
const out = resolve('store/screenshots'), raw = resolve('store/.raw')
mkdirSync(out, { recursive: true }); mkdirSync(raw, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const today = new Date().toISOString().slice(0, 10)

async function app(theme) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  const data = { settings: { theme, fontSize: 21, reminder: '08:00', instrument: 'organ' }, favourites: [1, 12, 45, 101, 150], recents: [101, 12, 45], streak: { last: today, count: 12 }, ads: { sessions: 3, opensSinceAd: 0, lastAdAt: 0, adFreeUntil: 0 }, adsRemoved: false }
  await page.evaluateOnNewDocument((v) => { localStorage.setItem('CapacitorStorage.hymns-daily-v1', v) }, JSON.stringify(data))
  await page.goto(base, { waitUntil: 'networkidle0' })
  await page.waitForSelector('h1'); await sleep(600)
  return { page, ctx }
}
const clickText = (page, re) => page.evaluate((src) => { const r = new RegExp(src, 'i'); const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim())); b?.click(); return !!b }, re.source)
async function openHymn(page, title) {
  await clickText(page, /^Hymns$/); await sleep(400)
  await page.type('input[type=search]', title); await sleep(500)
  await page.evaluate((t) => [...document.querySelectorAll('button, a, li, [role=button]')].find((e) => e.textContent.includes(t))?.click(), title)
  await sleep(700)
}
const shots = []
async function snap(page, name, caption, sub) { await page.screenshot({ path: `${raw}/${name}.png` }); shots.push({ name, caption, sub }) }
try {
  { const { page, ctx } = await app('dark'); await openHymn(page, 'Amazing Grace'); await clickText(page, /Play/); await sleep(2500)
    await snap(page, '1-music', 'Every hymn plays<br>with music', 'Church organ or piano · change tempo & key'); await ctx.close() }
  { const { page, ctx } = await app('dark'); await snap(page, '2-today', 'A hymn for<br>every day', 'Hymn of the day and verse of the day'); await ctx.close() }
  { const { page, ctx } = await app('dark'); await clickText(page, /^Hymns$/); await sleep(400); await page.type('input[type=search]', 'grace'); await sleep(700)
    await snap(page, '3-search', 'Find any hymn<br>in seconds', 'Search title, words or hymn number'); await ctx.close() }
  { const { page, ctx } = await app('light'); await openHymn(page, 'It Is Well'); await sleep(300)
    await snap(page, '4-lyrics', 'Large, clear<br>hymn lyrics', 'Refrain after every verse · adjustable text'); await ctx.close() }
  { const { page, ctx } = await app('light'); await openHymn(page, 'Holy, Holy, Holy'); await clickText(page, /Show music/); await sleep(1200)
    await page.waitForSelector('.sheet svg', { timeout: 8000 }); await page.evaluate(() => document.querySelector('.sheet').scrollIntoView({ block: 'start' })); await sleep(500)
    await snap(page, '5-sheet', 'Sing from the<br>sheet music', 'Four-part harmony for choirs'); await ctx.close() }
  { const { page, ctx } = await app('dark'); await clickText(page, /^Saved$/); await sleep(500)
    await snap(page, '6-offline', '100% offline.<br>No sign-up.', 'Your favourites stay on your phone'); await ctx.close() }
} catch (e) { console.error(e) }

const fonts = (f) => 'file://' + resolve('node_modules/@fontsource', f)
const css = `@font-face{font-family:Cinzel;src:url(${fonts('cinzel/files/cinzel-latin-600-normal.woff2')})}
@font-face{font-family:Corm;font-style:italic;src:url(${fonts('cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2')})}
body{margin:0}.f{width:1080px;height:1920px;position:relative;overflow:hidden;background:radial-gradient(80% 32% at 50% 6%,rgba(243,213,132,.30),transparent 70%),linear-gradient(180deg,#1d1640,#0b0a16);text-align:center;color:#f2e8cf}
h1{font-family:Cinzel;font-weight:600;font-size:76px;line-height:1.12;letter-spacing:.04em;margin:0;padding-top:96px;color:#f3d584}
p{font-family:Corm;font-style:italic;font-size:44px;margin:22px 0 0;color:#d9cba6}
.ph{position:absolute;left:50%;top:470px;transform:translateX(-50%);width:760px;height:1645px;border-radius:64px;overflow:hidden;border:3px solid rgba(223,188,102,.75);box-shadow:0 0 90px -10px rgba(243,213,132,.35),0 30px 80px rgba(0,0,0,.6)}
.ph img{width:100%;display:block}`
const page = await browser.newPage()
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 })
for (const s of shots) {
  const html = `<html><head><style>${css}</style></head><body><div class="f"><h1>${s.caption}</h1><p>${s.sub}</p><div class="ph"><img src="file://${raw}/${s.name}.png"></div></div></body></html>`
  const f = `${raw}/${s.name}.html`; writeFileSync(f, html)
  await page.goto('file://' + f, { waitUntil: 'networkidle0' }); await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${out}/${s.name}.png`, clip: { x: 0, y: 0, width: 1080, height: 1920 } })
}
// Feature graphic 1024x500
const icon = readFileSync('resources/brand/icon.svg', 'utf8').replace('<g id="bgl">', '<g id="bgl" style="display:none">').replace('width="512" height="512"', 'width="400" height="400"')
const fg = `<html><head><style>${css}
.g{width:1024px;height:500px;display:flex;align-items:center;gap:10px;padding:0 60px 0 40px;box-sizing:border-box;background:radial-gradient(50% 80% at 22% 45%,rgba(243,213,132,.28),transparent 70%),linear-gradient(180deg,#1d1640,#0b0a16);color:#f2e8cf}
.g h2{font-family:Cinzel;font-weight:600;font-size:66px;letter-spacing:.1em;margin:0;color:#f3d584}.g p{font-size:40px;margin:14px 0 0}</style></head>
<body><div class="g">${icon}<div><h2>HYMNS DAILY</h2><p>245 classic hymns with organ &amp; piano music. Offline.</p></div></div></body></html>`
writeFileSync(`${raw}/feature.html`, fg)
await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 })
await page.goto(`file://${raw}/feature.html`, { waitUntil: 'networkidle0' }); await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: 'store/feature-graphic.png', clip: { x: 0, y: 0, width: 1024, height: 500 } })
await browser.close(); server.kill()
console.log('rendered', shots.map((s) => s.name).join(', '))
