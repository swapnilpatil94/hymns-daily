import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hymnsdaily.app',
  appName: 'Hymns Daily: Hymn Book Offline',
  webDir: 'dist',
  loggingBehavior: 'none',
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false },
}

export default config
