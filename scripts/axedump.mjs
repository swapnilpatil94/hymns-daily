import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'
const theme = process.argv[2] || 'light'
const server = spawn('npx', ['vite','preview','--port','4175','--strictPort'], { cwd:'/home/claude/hymns-app', stdio:'ignore' })
await new Promise(r=>setTimeout(r,2500))
const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:true, args:['--no-sandbox'] })
const p = await b.newPage(); await p.setBypassCSP(true); await p.setViewport({width:390,height:844,deviceScaleFactor:2})
await p.goto('http://localhost:4175/',{waitUntil:'networkidle0'})
await p.evaluate(t=>document.documentElement.dataset.theme=t, theme)
await p.addScriptTag({content:readFileSync('/home/claude/hymns-app/node_modules/axe-core/axe.min.js','utf8')})
const tabs=['Today','Hymns','Saved','Settings']
for (const t of tabs){
 await p.evaluate(n=>[...document.querySelectorAll('nav button')].find(x=>x.textContent===n).click(),t)
 await new Promise(r=>setTimeout(r,300))
 const r=await p.evaluate(async()=>(await window.axe.run(document,{runOnly:['color-contrast']})).violations.flatMap(v=>v.nodes.map(n=>n.target.join(' ')+' :: '+n.any[0].message)))
 console.log(theme,t,r)
}
await b.close(); server.kill()
