// Sanity check under Chrome's STRICT autoplay policy with a real tap: the shared AudioContext must be running after Play.
// NOTE: desktop/Android Chrome use "sticky" activation, so this passes even without the unlock fix; it does NOT reproduce the iOS/WebKit lock.
import { spawn } from 'node:child_process'
import puppeteer from 'puppeteer-core'

const port = 4175
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 2500))
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--autoplay-policy=document-user-activation-required'] })
let failed = false
try {
  const page = await (await browser.createBrowserContext()).newPage()
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('h1')
  const before = await page.evaluate(() => window.abcjsAudioContext?.state ?? 'none')
  const btn = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Play'))
  await btn.asElement().tap()
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Pause/.test(b.textContent)), { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 1500))
  const after = await page.evaluate(() => window.abcjsAudioContext?.state ?? 'none')
  const ok = after === 'running'
  console.log(`${ok ? 'PASS' : 'FAIL'}: AudioContext before tap=${before}, after Play=${after} (strict autoplay policy)`)
  if (!ok) failed = true
} catch (e) { console.log('FAIL:', e.message); failed = true }
await browser.close(); server.kill()
process.exit(failed ? 1 : 0)
