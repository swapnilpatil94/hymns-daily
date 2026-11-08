# Hymns Daily — Product Spec v1 (MVP)

Owner: founder (solo). Prepared 2026-11-08 by the research lead. Evidence: /home/claude/research/ROUND5_GLOBAL_FINDINGS.md.

## Why this app exists (evidence)
- **Store autocomplete** (US, GB, PH and NG all show the same long-tail): "hymn book offline", "hymn book with audio offline", "hymnal song book offline", "church hymns in english", "gospel hymns and songs".
- **What users complain about:** across 1,623 recent reviews of the top 10 US hymn apps, 280 are ≤3★. Of those:
  - **81 (29%) complain about audio**: no audio, or audio needs strange permissions or doesn't play.
  - Others: search/number (26), ads (19), crashes (18), missing hymns (12).
- **Incumbents are old and small:** 100K–500K installs, mostly 2014–2019 builds.
- **Our edge:** every hymn plays offline with music, there are no permissions, it is fast, and it has a daily habit loop.

## Content (already prepared; do not add other content)
- `content/hymns.json`: 245 hymn records from the Open Hymnal Project.
  - Each record has title, credit, author, composer, category, topics, scripture, meter, verses[], refrain, and abc_file.
  - Every record passed a strict filter: credit years ≤1930 (US) and all creators died ≤1955 (UK/EU life+70).
  - **Several titles appear more than once with different tunes**: group them by `id` and show "Tune: X" alternatives.
- `content/abc/*.abc`: ABC notation (melody plus harmony), used for audio and optional sheet music.
- `content/verses_web.json`: 147 verses from the World English Bible (public domain).
  - Refs are like "1corinthians 13:4"; format them as "1 Corinthians 13:4".
  - Always show the attribution "World English Bible (Public Domain)".
- The About screen credits: "Hymn texts and music: Open Hymnal Project (public domain)" and "Scripture: World English Bible".

## Screens
1. **Today** (home).
   - Hymn of the Day: a deterministic rotation by date, seasonal (Advent/CHRISTMAS in Dec, EASTER category around Easter, otherwise rotate the rest).
   - Verse of the Day.
   - A "Play" button.
   - Streak counter: days opened, stored locally.
2. **Hymns list.**
   - Instant search across title, first line and full text (diacritic- and punctuation-insensitive).
   - Filter by category and topic.
   - A-Z index and hymn number (1..245).
3. **Hymn detail.**
   - Large readable verses, with the refrain shown after each verse.
   - Font size slider (persisted).
   - Credits line and scripture refs.
   - Play / pause / tempo / transpose (±3 semitones).
   - Optional "Show music" (sheet music via abcjs).
   - Favourite ♥ and Share (text plus a store link placeholder).
4. **Favourites** and **Recently viewed**.
5. **Settings.**
   - Theme: light/dark/system.
   - Font size.
   - Daily reminder time (local notification).
   - "Remove ads" purchase and Restore purchase.
   - Privacy options (re-open the consent form).
   - Privacy policy link, About, Rate app.

## Audio (the key differentiator)
- Use **abcjs** synth. Soundfont samples must be **bundled locally** (no network at runtime).
  - Instrument: church organ (instrument 19) as the default; piano (0) as an option.
  - Get them from github.com/paulrosen/midi-js-soundfonts, which is what abcjs uses (the abcjs/ folder).
  - Bundle only the notes the hymns need, or the whole instrument folder if it stays under about 6 MB.
- Requires no permissions, works in airplane mode, and keeps playing when the screen is on.
- Playing highlights the current verse line if feasible; this is a stretch goal.

## Monetisation
- **AdMob** via `@capacitor-community/admob` (or the current maintained plugin).
  - Use Google's **test ad unit IDs only**; real IDs come later from the founder.
  - Adaptive banner on the list and detail screens, never over lyrics.
  - At most **one interstitial per 4 hymn opens and at least 3 minutes apart**.
  - Never show an interstitial while audio plays or on the first session.
  - App-open ad: no.
  - Rewarded "ad-free for 24h" is an optional extra.
- **Consent:** Google UMP via the plugin (`requestConsentInfo` / `showConsentForm`) before any ad loads; there is a "Privacy options" entry in Settings.
- **Remove ads:** a one-time non-consumable in-app product `remove_ads` (Google Play Billing via a maintained Capacitor plugin, e.g. `@revenuecat/purchases-capacitor` or `cordova-plugin-purchase`).
  - No backend.
  - Store the entitlement locally and re-check it on launch with restore.
- Not child-directed: set `tagForChildDirectedTreatment=false` and target audience 18+ in the Console.

## Tech
- **React + TypeScript + Vite + Capacitor (Android).** The founder is a senior React developer, so keep the code idiomatic and small.
- Fully offline. Bundle the content at build time and pre-build a search index.
- No backend, no analytics SDK, no accounts.
- Local storage: `@capacitor/preferences` or localStorage.
- Local notifications: `@capacitor/local-notifications` for the daily reminder. Android 13+ needs the POST_NOTIFICATIONS runtime prompt, shown only when the user enables the reminder.
- Android: minSdk 24, current target SDK required by Play.
- App id placeholder: `com.hymnsdaily.app`. App name: "Hymns Daily: Hymn Book Offline". Package and name are changeable later.
- Performance: cold start under 2 s on a mid-range phone; list virtualised; ABC parsed lazily per hymn.

## Store-listing assets to draft (text only)
- **Title:** "Hymns Daily: Hymn Book Offline"
- **Short description:** "245 classic hymns with music. Offline, free, no permissions."
- **Full description:** about 2,500 chars, naturally using these phrases: hymn book offline, hymns with audio, church hymns in English, hymnal song book, gospel hymns, hymn of the day, Christian hymns, worship songs. No keyword stuffing.
- **Privacy policy** (markdown):
  - The app collects no personal data.
  - AdMob may use advertising ID per consent.
  - Purchases are handled by Google Play.
- **Data safety form answers.**

## Acceptance checklist
- `npm run build` passes, with TypeScript strict and no errors.
- Unit tests (vitest) for: verse formatting, hymn-of-day rotation, search, ad-frequency rules.
- `npx cap sync android` succeeds and the Android project exists.
- If the Android SDK/Gradle is available, an assembled debug APK. If not, document the exact steps for the founder's laptop.
- Manual smoke test in a browser (vite preview): search works, a hymn plays audio with no network requests at runtime (check the network tab via test or instructions).
- README with run/build/release steps and where to paste real AdMob IDs and the product id.
