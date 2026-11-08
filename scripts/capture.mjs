import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'
const out = process.argv[2]; mkdirSync(out + '/frames', { recursive: true })
const server = spawn('npx', ['vite','preview','--port','4176','--strictPort'], { stdio:'ignore' })
await new Promise(r=>setTimeout(r,2500))
const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:true, args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] })
const wait = (ms)=>new Promise(r=>setTimeout(r,ms))
const tab = (p,n)=>p.evaluate(n=>[...document.querySelectorAll('nav button')].find(x=>x.textContent===n).click(),n)
async function session(theme, prefix, video){
  const p = await b.newPage(); await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true})
  await p.evaluateOnNewDocument(t=>localStorage.setItem('x',t),theme)
  await p.goto('http://localhost:4176/',{waitUntil:'networkidle0'})
  await p.evaluate(t=>document.documentElement.dataset.theme=t,theme)
  let f=0; const snap=async(name)=>{ if(name) await p.screenshot({path:`${out}/${prefix}-${name}.png`}); if(video){ await p.screenshot({path:`${out}/frames/f${String(f++).padStart(4,'0')}.png`}) } }
  const hold=async(n)=>{ for(let i=0;i<n;i++){ await snap(); await wait(120)} }
  await snap('1-today'); await hold(video?12:0)
  if(video){ await p.evaluate(()=>document.querySelector('.screen').scrollTo({top:400})); await hold(8); await p.evaluate(()=>document.querySelector('.screen').scrollTo({top:0})); }
  await tab(p,'Hymns'); await wait(400); await snap('2-hymns'); await hold(video?8:0)
  await p.type('input[type=search]','Amazing Grace'); await wait(400); await p.click('.row'); await p.waitForSelector('.lyrics'); await wait(300)
  await snap('3-hymn'); await hold(video?8:0)
  await p.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Play').click())
  await p.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Pause'),{timeout:30000}); await wait(500)
  await snap('4-playing'); await hold(video?14:0)
  await p.evaluate(()=>document.querySelector('.scroll').scrollTo({top:520})); await wait(300); await snap('5-lyrics'); await hold(video?10:0)
  await p.goBack(); await wait(300); await tab(p,'Settings'); await wait(300); await snap('6-settings'); await hold(video?8:0)
  await p.close()
}
await session('dark','night',true)
await session('light','day',false)
await b.close(); server.kill()
