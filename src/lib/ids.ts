/**
 * AdMob + Play Billing identifiers.
 * Values below are Google's documented TEST ids and the app-id placeholder. Replace for release
 * (see README: "Real AdMob ids"). The real AdMob *app* id also goes in android/app/src/main/AndroidManifest.xml.
 */
export const ADMOB = {
  banner: 'ca-app-pub-3940256099942544/9214589741', // Google test: adaptive banner
  interstitial: 'ca-app-pub-3940256099942544/1033173712', // Google test: interstitial
  isTesting: true, // set false for release builds with real unit ids
} as const

export const REMOVE_ADS_PRODUCT_ID = 'remove_ads'
export const PRIVACY_POLICY_URL = 'https://example.com/hymns-daily/privacy' // TODO founder: host PRIVACY policy from STORE_LISTING.md
export const STORE_URL = 'https://play.google.com/store/apps/details?id=com.hymnsdaily.app' // placeholder until listed
export const APP_ID = 'com.hymnsdaily.app'
