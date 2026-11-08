// Hardening e2e (headless Chrome, mobile viewport, 4x CPU throttle): CSP, corrupt storage, offline, a11y, startup time.
// Usage: npm run build && node scripts/e2e.mjs
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const port = 4174
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 2500))
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
let failed = false
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}: ${msg}`); if (!ok) failed = true }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const click = (page, label) => page.evaluate((l) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === l)?.click(), label)
const base = `http://localhost:${port}/`
const KEY = 'CapacitorStorage.hymns-daily-v1'
async function fresh(storage) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const cdp = await page.createCDPSession()
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const log = { errors: [], csp: [], requests: [], console: [] }
  page.on('pageerror', (e) => log.errors.push(String(e)))
  page.on('console', (m) => { const t = m.text(); log.console.push(t); if (/Content Security Policy|violates the following/i.test(t)) log.csp.push(t) })
  page.on('request', (r) => log.requests.push(r.url()))
  if (storage !== undefined) await page.evaluateOnNewDocument((k, v) => { try { localStorage.setItem(k, v) } catch {} }, KEY, storage)
  return { page, log, ctx }
}
try {
  // 1. Clean start: startup time, CSP, no errors.
  {
    const { page, log, ctx } = await fresh()
    const t0 = Date.now()
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('h1')
    const ms = Date.now() - t0
    check(ms < 2500, `cold start to first content ${ms} ms under 4x CPU throttle (<2500)`)
    check(log.csp.length === 0, `no CSP violations on load ${log.csp[0] ?? ''}`)
    check(log.errors.length === 0, `no page errors on load ${log.errors[0] ?? ''}`)
    const csp = await page.$eval('meta[http-equiv=Content-Security-Policy]', (m) => m.content)
    check(/script-src 'self'/.test(csp) && !/unsafe-eval/.test(csp) && /object-src 'none'/.test(csp), 'CSP forbids eval, remote scripts, plugins')
    // inline script injection must be blocked
    const injected = await page.evaluate(() => { window.__xss = 0; const s = document.createElement('script'); s.textContent = 'window.__xss=1'; document.body.appendChild(s); return window.__xss })
    check(injected === 0, 'injected inline script is blocked by CSP')
    // 2. a11y (axe) on Today
    // 3. Offline: go offline, use the app and play audio.
    await click(page, 'Hymns'); await page.waitForSelector('input[type=search]')
    await page.setRequestInterception(true)
    page.on('request', (r) => { if (/^(http:\/\/localhost|data:|blob:)/.test(r.url())) r.continue(); else { log.blocked = (log.blocked ?? 0) + 1; r.abort() } })
    await page.type('input[type=search]', 'it is well'); await sleep(400)
    await page.click('.row'); await page.waitForSelector('.lyrics')
    await click(page, 'Play')
    const ok = await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Pause'), { timeout: 30000 }).then(() => true).catch(() => false)
    check(ok, `OFFLINE: search + hymn + audio work with all non-local traffic blocked (${log.blocked ?? 0} remote requests attempted)`)
    check((log.blocked ?? 0) === 0, 'app attempted zero remote requests while offline')
    check(log.errors.length === 0, `no page errors during offline use ${log.errors[0] ?? ''}`)
    await ctx.close()
  }
  // 2b. a11y with axe-core on each main screen (CSP bypassed only in this audit page so axe can inject).
  {
    const { page, ctx } = await fresh()
    await page.setBypassCSP(true)
    await page.goto(base, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('h1')
    await page.addScriptTag({ content: readFileSync('node_modules/axe-core/axe.min.js', 'utf8') })
    const run = () => page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((v) => `${v.id}(${v.nodes.length}) ${v.impact}`))
    const out = {}
    out.Today = await run()
    for (const tab of ['Hymns', 'Saved', 'Settings']) { await click(page, tab); await sleep(400); out[tab] = await run() }
    await click(page, 'Hymns'); await page.waitForSelector('.row'); await page.click('.row'); await page.waitForSelector('.lyrics'); await sleep(300)
    out.Detail = await run()
    for (const [k, v] of Object.entries(out)) console.log(`axe ${k}:`, v.join('; ') || 'no violations')
    check(Object.values(out).flat().filter((x) => /critical|serious/.test(x)).length === 0, 'axe: no critical/serious WCAG A/AA violations')
    await ctx.close()
  }
  // 4. Hostile / corrupt storage must not crash the app.
  for (const [name, val] of [['truncated JSON', '{"settings":{"theme":"dar'], ['wrong types', JSON.stringify({ settings: 'x', favourites: 'y', recents: { a: 1 }, ads: [], streak: 5, adsRemoved: 'yes' })], ['unknown hymn ids', JSON.stringify({ favourites: [999999, -1, 5], recents: [888888] })], ['huge font', JSON.stringify({ settings: { fontSize: 1e9, theme: '<img src=x onerror=alert(1)>' } })]]) {
    const { page, log, ctx } = await fresh(val)
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    const ok = await page.waitForSelector('h1', { timeout: 8000 }).then(() => true).catch(() => false)
    await click(page, 'Saved'); await sleep(300)
    const alive = await page.$('#root > *')
    check(ok && !!alive && log.errors.length === 0, `corrupt storage "${name}": app starts and Saved tab opens ${log.errors[0] ?? ''}`)
    await ctx.close()
  }
  // 5. Touch targets on the main chrome (>=44px).
  {
    const { page, ctx } = await fresh()
    await page.goto(base, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('h1')
    const small = await page.evaluate(() => [...document.querySelectorAll('button, a, input, [role=button]')].map((e) => { const r = e.getBoundingClientRect(); return { t: (e.textContent || e.getAttribute('aria-label') || e.type || '').trim().slice(0, 20), w: r.width, h: r.height } }).filter((x) => x.w > 0 && (x.h < 44 || x.w < 44)))
    console.log('touch targets under 44px on Today:', small.length ? JSON.stringify(small) : 'none')
    await ctx.close()
  }
} catch (e) { console.error(e); failed = true } finally { await browser.close(); server.kill() }
process.exit(failed ? 1 : 0)
