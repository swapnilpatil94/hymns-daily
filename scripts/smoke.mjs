// Browser smoke test: serves dist with `vite preview`, drives headless Chrome, asserts search works,
// a hymn plays, and every network request during the run stays on localhost (no remote audio/anything).
// Usage: npm run build && npm run smoke   (set CHROME=/path/to/chrome if not at /usr/bin/google-chrome)
import { spawn } from 'node:child_process'
import puppeteer from 'puppeteer-core'

const port = 4173
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 2500))
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
let failed = false
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}: ${msg}`); if (!ok) failed = true }
try {
  const page = await browser.newPage()
  const urls = []
  const errors = []
  page.on('request', (r) => urls.push(r.url()))
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle0' })
  check((await page.$eval('h1', (e) => e.textContent)) === 'Hymns Daily', 'Today screen renders')
  check((await page.$eval('blockquote', (e) => e.textContent.length)) > 10, 'verse of the day shown')
  await page.evaluate(() => [...document.querySelectorAll('nav button')].find((b) => b.textContent === 'Hymns').click())
  await page.waitForSelector('input[type=search]')
  await page.type('input[type=search]', 'Amazing Grace!')
  await new Promise((r) => setTimeout(r, 400))
  const first = await page.$eval('.row .rowtitle', (e) => e.textContent)
  check(/amazing grace/i.test(first), `search finds "${first}"`)
  await page.click('.row')
  await page.waitForSelector('.lyrics')
  check((await page.$$('.verse')).length >= 3, 'hymn detail shows verses')
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'Play').click())
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Pause'), { timeout: 30000 })
  check(true, 'audio started (button shows Pause)')
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'Show music').click())
  await page.waitForSelector('.sheet svg', { timeout: 10000 })
  check(true, 'sheet music renders')
  const remote = urls.filter((u) => !/^(http:\/\/localhost|data:|blob:)/.test(u))
  const samples = urls.filter((u) => u.includes('/soundfonts/'))
  check(remote.length === 0, `no remote requests (${urls.length} total, ${samples.length} local samples)${remote.length ? ': ' + remote.join(', ') : ''}`)
  check(samples.length > 0, 'samples loaded from local /soundfonts/')
  check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`)
} finally {
  await browser.close()
  server.kill()
}
process.exit(failed ? 1 : 0)
