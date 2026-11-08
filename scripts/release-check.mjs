// Release gate: fails (exit 1) while any development placeholder or insecure setting remains.
// Usage: npm run release:check   (run before building the release AAB)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const read = (p) => readFileSync(p, 'utf8')
let bad = 0
const rule = (ok, msg, hint = '') => { console.log(`${ok ? 'OK  ' : 'FAIL'}  ${msg}${!ok && hint ? `\n        -> ${hint}` : ''}`); if (!ok) bad++ }
const ids = read('src/lib/ids.ts')
const manifest = read('android/app/src/main/AndroidManifest.xml')
const gradle = read('android/app/build.gradle')

rule(!ids.includes('3940256099942544'), 'Real AdMob unit ids set (no Google test ids in ids.ts)', 'Create ad units in AdMob and paste them in src/lib/ids.ts')
rule(/isTesting:\s*false/.test(ids), 'ADMOB.isTesting is false', 'Set isTesting: false for release (never click your own live ads)')
rule(!manifest.includes('3940256099942544'), 'Real AdMob APP id in AndroidManifest.xml', 'Replace com.google.android.gms.ads.APPLICATION_ID')
rule(!/example\.com/.test(ids), 'Privacy policy URL is real (not example.com)', 'Host the policy text from STORE_LISTING.md and set PRIVACY_POLICY_URL')
rule(!/placeholder/i.test(ids.split('\n').filter((l) => l.includes('STORE_URL')).join('')), 'STORE_URL no longer a placeholder', 'Update after the listing is live (package id must match)')
rule(/allowBackup="false"/.test(manifest), 'Android auto-backup disabled')
rule(/usesCleartextTraffic="false"/.test(manifest), 'Cleartext HTTP disabled')
rule(!/debuggable\s+true/.test(gradle) && /minifyEnabled true/.test(gradle) && /shrinkResources true/.test(gradle), 'Release is non-debuggable, R8-minified and resource-shrunk')
rule(/webContentsDebuggingEnabled:\s*false/.test(read('capacitor.config.ts')), 'WebView remote debugging disabled')
rule(existsSync('android/keystore.properties'), 'Release signing configured (android/keystore.properties)', 'See android/keystore.properties.example')
rule(/Content-Security-Policy/.test(read('index.html')), 'Content-Security-Policy present')
const versionCode = /versionCode\s+(\d+)/.exec(gradle)?.[1]
console.log(`INFO  versionCode=${versionCode} (increment for every Play upload)`)
// built assets must not reference remote hosts except documented ones
if (existsSync('dist')) {
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
  const remote = new Set()
  for (const f of walk('dist').filter((f) => /\.(html|js|css)$/.test(f))) for (const m of read(f).matchAll(/https?:\/\/[a-z0-9.-]+/gi)) remote.add(m[0].toLowerCase().replace(/^https?:\/\//, ''))
  console.log(`INFO  hosts referenced in built web assets: ${[...remote].sort().join(', ') || 'none'}`)
}
console.log(bad ? `\n${bad} blocker(s). NOT ready to publish.` : '\nAll release gates passed.')
process.exit(bad ? 1 : 0)
