import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hymnsdaily.app',
  appName: 'Hymns Daily',
  backgroundColor: '#0b0a16', // matches the splash; avoids a white flash before the web view paints
  webDir: 'dist',
  loggingBehavior: 'none',
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false },
}

export default config
