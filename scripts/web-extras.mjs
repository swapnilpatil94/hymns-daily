// Web-only assets (promo video) are copied into dist AFTER the normal build, so the Android app
// (built from `npm run build`) never bundles them. Used by `npm run build:web` and the web deploy workflow.
import { cpSync } from 'node:fs'
cpSync('web', 'dist', { recursive: true })
console.log('web-only assets copied to dist/')
