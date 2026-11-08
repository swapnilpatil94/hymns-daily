# Hymns Daily: Hymn Book Offline

Android app (React + TypeScript + Vite + Capacitor). 245 public-domain hymns with organ/piano audio, fully offline, no permissions, no backend, no analytics.
Spec: `PRODUCT_SPEC.md`. Store texts: `STORE_LISTING.md`.

## Run, test, build (web)
```bash
npm install
npm run dev              # dev server
npm test                 # vitest: verse formatting, rotation, search, ad rules, offline-audio runtime check
npm run build            # tsc (strict) + vite build -> dist/
npm run verify:offline-audio   # post-build: audio assets are local, no unexpected remote soundfont URL
npm run smoke            # headless Chrome (needs /usr/bin/google-chrome or CHROME=...): search, play, sheet music, asserts all requests are localhost
npm run test:sweep       # slow (~70 s): every hymn x both instruments x transpose +-3 needs only bundled samples
```
Manual check: `npm run build && npx vite preview`, open DevTools > Network, play a hymn: only `/soundfonts/...` and `/abc/...` requests from localhost.

## Android
Needs JDK 21 and the Android SDK (platform 36, build-tools). Set `ANDROID_HOME` (or `android/local.properties` with `sdk.dir=...`).
```bash
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug      # -> android/app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
Or `npx cap open android` and use Android Studio. minSdk 24, target/compile SDK 36 (Capacitor 8 defaults, see `android/variables.gradle`).
The `android/` folder is committed source; re-run `npx cap sync android` after every web change or plugin update.

### Release AAB
1. Create an upload keystore: `keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000` (keep it out of git, back it up).
2. Add signing config in `android/app/build.gradle` (or use Android Studio: Build > Generate Signed Bundle).
3. `cd android && ./gradlew bundleRelease` -> `app/build/outputs/bundle/release/app-release.aab`. Bump `versionCode`/`versionName` in `android/app/build.gradle` for each upload.
4. Enroll in Play App Signing when uploading.

## Where to put real ids
| What | Where |
|---|---|
| AdMob **app id** | `android/app/src/main/AndroidManifest.xml`, meta-data `com.google.android.gms.ads.APPLICATION_ID` (currently Google's TEST app id) |
| AdMob banner + interstitial **unit ids**, `isTesting` | `src/lib/ids.ts` (`ADMOB`; set `isTesting: false` for release) |
| `remove_ads` product id | `src/lib/ids.ts` (`REMOVE_ADS_PRODUCT_ID`). Create it in Play Console > Monetize > In-app products as a one-time (non-consumable) product with the same id |
| Package name / app name | `capacitor.config.ts`, `android/app/build.gradle` (`applicationId`), `android/app/src/main/res/values/strings.xml`. Change before first upload; it cannot change after |
| Privacy policy URL, store URL | `src/lib/ids.ts` (`PRIVACY_POLICY_URL`, `STORE_URL`). Host the policy text from `STORE_LISTING.md` on a public page |

AdMob setup: create the app in AdMob, create a Banner and an Interstitial unit, then in AdMob > Privacy & messaging create a **GDPR message** (UMP) and enable "Privacy options" so Settings > Privacy options works. Add your own device as a test device while developing. Never click your own live ads.
Billing: purchases use `cordova-plugin-purchase` (Google Play Billing, no backend). The entitlement is cached locally and re-checked with `restorePurchases()` on each launch (it is only ever upgraded locally, so an offline launch never drops it). Test with a license tester account and an internal-testing track build; billing does not work from a sideloaded debug APK that is not on a Play track.

## Behaviour notes
- Ads: adaptive banner on Hymns list and hymn detail only (lyrics scroll in a container padded by the banner height). Interstitial: every 4th hymn open, at least 3 min apart, never while audio plays, never in the first session, never after Remove ads (`src/lib/adRules.ts`). No app-open ad. UMP consent runs before AdMob init and any ad load. `tagForChildDirectedTreatment=false`.
- Daily reminder: `@capacitor/local-notifications`, inexact daily alarm; the Android 13+ notification prompt appears only when the user switches the reminder on. `SCHEDULE_EXACT_ALARM` is stripped from the merged manifest.
- Audio: abcjs synth with soundfont samples bundled in `public/soundfonts/` (organ = program 19, default; piano = 0), `soundFontUrl` is the local path. Samples trimmed to G1-C6 (covers all hymns at +-3 semitones; proven by the sweep test). Total app assets ~15 MB.
- Not done: line-by-line lyric highlighting during playback (stretch goal) and rewarded "ad-free 24h" (optional); state for it (`adFreeUntil`) is already honored by the rules.

## Closed testing requirement (new personal developer accounts)
Google Play requires a **closed test with at least 12 testers opted in for 14 continuous days** before you can apply for production access. Start it early: recruit 15-20 testers (friends, church groups, family) to cover drop-outs, have them join via the opt-in link and keep the app installed, then apply for production in Play Console.

## Content and licences
Hymns: Open Hymnal Project (public domain, filtered by credit year and author death year). Scripture: World English Bible (public domain). Soundfont: see `public/soundfonts/CREDITS.txt` (CC BY 3.0 family, keep the attribution in About). Do not add other hymn or Bible text without clearance.

## Versions
React 19.3, Vite 8.3, TypeScript 7.0, vitest 5.1, abcjs 6.7.2, Capacitor core/cli/android 8.6.0, @capacitor-community/admob 8.3.0, @capacitor/preferences 8.0.1, @capacitor/local-notifications 8.3.1, cordova-plugin-purchase 13.20.0.
