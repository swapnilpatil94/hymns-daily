import { Capacitor } from '@capacitor/core'
import { AdMob, AdmobConsentStatus, BannerAdPosition, BannerAdSize, BannerAdPluginEvents } from '@capacitor-community/admob'
import { ADMOB } from './ids'

/** Thin AdMob wrapper. All calls are no-ops on web. Consent (UMP) always precedes initialisation and any ad load. */
let ready = false
const native = Capacitor.isNativePlatform()

export async function initAds(): Promise<boolean> {
  if (!native) return false
  try {
    await AdMob.initialize({ tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false })
    let info = await AdMob.requestConsentInfo()
    if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) info = await AdMob.showConsentForm()
    ready = info.canRequestAds
    if (ready) void prepareInterstitial()
  } catch (e) {
    console.warn('ads init failed', e)
  }
  return ready
}

export const adsReady = (): boolean => ready

/** Settings > Privacy options: re-open the consent form. */
export async function openPrivacyOptions(): Promise<void> {
  if (native) await AdMob.showPrivacyOptionsForm()
}

export async function showBanner(marginDp: number, onHeight: (px: number) => void): Promise<() => void> {
  if (!native || !ready) return () => {}
  const h = await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (s) => onHeight(s.height))
  try {
    await AdMob.showBanner({ adId: ADMOB.banner, adSize: BannerAdSize.ADAPTIVE_BANNER, position: BannerAdPosition.BOTTOM_CENTER, margin: marginDp, isTesting: ADMOB.isTesting })
  } catch (e) {
    console.warn('banner failed', e)
  }
  return () => {
    void h.remove()
    onHeight(0)
    void AdMob.removeBanner().catch(() => {})
  }
}

export async function prepareInterstitial(): Promise<void> {
  if (!native || !ready) return
  try {
    await AdMob.prepareInterstitial({ adId: ADMOB.interstitial, isTesting: ADMOB.isTesting })
  } catch (e) {
    console.warn('interstitial prepare failed', e)
  }
}

/** Returns true if an interstitial was actually shown. Caller has already applied the frequency rules. */
export async function showInterstitial(): Promise<boolean> {
  if (!native || !ready) return false
  try {
    await AdMob.showInterstitial()
    void prepareInterstitial()
    return true
  } catch {
    void prepareInterstitial()
    return false
  }
}
