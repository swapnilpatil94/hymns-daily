# Hymns Daily — production readiness (2026-11-08)

**Verdict: release-candidate for the web layer; NOT yet publishable.** The Android binary has never been compiled or run (Android SDK/Gradle downloads are blocked in the build sandbox), and six release blockers need your accounts/keys.

## Verified by running it (headless Chrome, 390x844 mobile, 4x CPU throttle)
| Check | Result |
|---|---|
| Unit tests (store sanitising, content integrity, copyright window, ad rules, search, rotation, audio) | 39 pass |
| Strict TypeScript, production build | pass |
| `npm audit` (prod + dev) | 0 vulnerabilities |
| Cold start to first content | ~0.5 s |
| Offline: search, open hymn, play audio with all non-local traffic blocked | pass, 0 remote requests |
| Content-Security-Policy: no eval, no remote scripts, injected inline script blocked | pass |
| Accessibility (axe-core WCAG 2.0/2.1 A+AA) on Today, Hymns, Saved, Settings, Detail | 0 violations |
| Touch targets >= 44 px | pass |
| Corrupt / hostile saved data (truncated JSON, wrong types, unknown ids, XSS strings, huge font) | app starts, no errors |
| Every one of 245 hymns plays on organ + piano, +/-3 semitones (`npm run test:sweep`) | pass (ran earlier) |

## Defects found and fixed in this review
1. **Android backup was on** -> disabled (+ data-extraction rules), cleartext off.
2. **Release build was unshrunk/unobfuscated** -> R8 + resource shrinking, keep rules for Capacitor/AdMob/Billing, `debuggable false`.
3. **No CSP** -> strict CSP added; WebView remote debugging explicitly off; native logging off.
4. **Saved data trusted blindly** -> every field validated/clamped (`sanitize`), size-capped.
5. **No crash screen** -> ErrorBoundary.
6. **Lyrics contained music-notation leftovers** (e.g. "i- dol", "hope\-when") in 8 hymns -> cleaner + regression test over all 245.
7. **Soundfont licence** (earlier) -> CC BY 3.0 credit shown in About.
8. Added `npm run release:check` gate, release-signing hook, keystore template, `.gitignore` for keys.

## NOT verified (be honest)
- **Android APK/AAB has not been built or run.** Gradle config edits (signing, R8 rules) are untested; the first real build may need small rule tweaks. Run on a physical phone before the closed test.
- **AdMob/UMP consent flow, banner, interstitial, Play Billing** are native; only exercisable on a device with a Play-installed build. Verify with Ad Inspector and a license-tester account. Note: the plugin initialises the Mobile Ads SDK before the consent form (plugin's documented order); confirm on device that no ad requests fire before consent is granted/not required.
- **Entitlement is local-only (no server receipt validation).** Acceptable for a ~$3 unlock; rooted users can fake it. It is never revoked automatically (so offline/refund edge cases favour the user).
- Reminder notification delivery across OEM battery savers.
- Legal text (privacy policy, Data safety answers), tax/GST registration: needs your review/CA.

## Release blockers (`npm run release:check` shows these)
Real AdMob app id + unit ids, `isTesting:false`, hosted privacy-policy URL, real store URL, upload keystore, and (Play rules) closed test: 12 testers x 14 days on a personal account.

## How to re-run everything
`npm test && npm run build && npm run smoke && npm run e2e && npm run audit:prod && npm run release:check`

## Sacred redesign (2026-11-08)
Candlelight (night) and Parchment (day) themes; Cinzel / Cormorant Garamond / EB Garamond bundled locally (SIL OFL 1.1, credited in About). Re-verified: tsc, unit tests, smoke 9/9, e2e incl. offline + CSP, axe 0 violations (both themes' contrast checked). Screenshots/video are headless Chrome at 390x844, NOT an Android emulator.
