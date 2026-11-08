/// <reference types="cordova-plugin-purchase" />
import { Capacitor } from '@capacitor/core'
import { REMOVE_ADS_PRODUCT_ID } from './ids'

declare global {
  interface Window {
    CdvPurchase?: typeof CdvPurchase
  }
}

/**
 * "Remove ads" one-time product via cordova-plugin-purchase (Google Play Billing, no backend).
 * Entitlement is stored locally by the caller and re-verified on launch through restorePurchases().
 */
export async function initBilling(onOwned: (owned: boolean) => void): Promise<void> {
  const cdv = window.CdvPurchase
  if (!Capacitor.isNativePlatform() || !cdv) return
  const { store, ProductType, Platform } = cdv
  store.register([{ id: REMOVE_ADS_PRODUCT_ID, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY }])
  const check = () => onOwned(store.owned(REMOVE_ADS_PRODUCT_ID))
  store.when().approved((t) => t.finish()).finished(check).productUpdated(check).receiptUpdated(check)
  await store.initialize([Platform.GOOGLE_PLAY])
  await store.restorePurchases() // re-check entitlement on every launch
  check()
}

export async function buyRemoveAds(): Promise<string> {
  const cdv = window.CdvPurchase
  if (!cdv) return 'Purchases are available in the Android app.'
  const offer = cdv.store.get(REMOVE_ADS_PRODUCT_ID)?.getOffer()
  if (!offer) return 'Product not available yet. Try again later.'
  const err = await offer.order()
  return err ? err.message : ''
}

export async function restorePurchases(): Promise<string> {
  const cdv = window.CdvPurchase
  if (!cdv) return 'Purchases are available in the Android app.'
  const err = await cdv.store.restorePurchases()
  return err ? err.message : 'Purchases restored.'
}

export const priceOfRemoveAds = (): string | undefined => window.CdvPurchase?.store.get(REMOVE_ADS_PRODUCT_ID)?.getOffer()?.pricingPhases[0]?.price
