// Renders brand assets from resources/brand/icon.svg: Android launcher icons (legacy, round, adaptive
// foreground), splash screens, Play Store 512 icon and the web favicon. Usage: node scripts/brand.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const svg = readFileSync('resources/brand/icon.svg', 'utf8')
const fgOnly = (scale) => svg.replace('<g id="bgl">', '<g id="bgl" style="display:none">').replace('<g id="fg">', `<g id="fg" transform="translate(256 256) scale(${scale}) translate(-256 -256)">`)
const res = 'android/app/src/main/res'
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true })
const page = await browser.newPage()
async function render(markup, w, h, out, { css = '', transparent = false } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup}<style>svg{display:block}${css}</style></body></html>`)
  mkdirSync(out.replace(/\/[^/]+$/, ''), { recursive: true })
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h }, omitBackground: transparent })
}
const sized = (s, n) => s.replace('width="512" height="512"', `width="${n}" height="${n}"`)
// Play Store icon: full-bleed 512x512 (Play applies its own mask).
await render(sized(svg, 512), 512, 512, 'store/icon-512.png')
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
for (const [d, k] of Object.entries(dens)) {
  const legacy = Math.round(48 * k), adaptive = Math.round(108 * k)
  await render(sized(svg, legacy), legacy, legacy, `${res}/mipmap-${d}/ic_launcher.png`, { css: `svg{border-radius:${legacy * 0.18}px;overflow:hidden}`, transparent: true })
  await render(sized(svg, legacy), legacy, legacy, `${res}/mipmap-${d}/ic_launcher_round.png`, { css: 'svg{border-radius:50%;overflow:hidden}', transparent: true })
  // Adaptive foreground: content shrunk into the 66dp safe circle.
  await render(sized(fgOnly(0.74), adaptive), adaptive, adaptive, `${res}/mipmap-${d}/ic_launcher_foreground.png`, { transparent: true })
}
// Splash screens: midnight background with the emblem centred.
const splash = (w, h) => { const m = Math.round(Math.min(w, h) * 0.42); return `<div style="width:${w}px;height:${h}px;display:grid;place-items:center;background:radial-gradient(70% 45% at 50% 42%, rgba(243,213,132,.18), transparent 70%), linear-gradient(180deg,#1d1640,#0b0a16)">${sized(fgOnly(1), m)}</div>` }
const sizes = { 'drawable': [480, 320], 'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720], 'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280], 'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280], 'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920] }
for (const [dir, [w, h]] of Object.entries(sizes)) await render(splash(w, h), w, h, `${res}/${dir}/splash.png`)
// Web favicon: the same emblem as SVG.
writeFileSync('public/favicon.svg', svg.replace('<rect width="512" height="512" fill="url(#bg)"/>', '<rect width="512" height="512" rx="96" fill="url(#bg)"/>'))
await browser.close()
console.log('brand assets rendered')
