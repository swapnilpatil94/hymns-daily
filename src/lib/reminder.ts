import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const ID = 1

/** Schedule (or cancel with null) the daily reminder. Permission is requested only when the user enables it. */
export async function setDailyReminder(time: string | null): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return time !== null
  await LocalNotifications.cancel({ notifications: [{ id: ID }] })
  if (!time) return true
  let perm = await LocalNotifications.checkPermissions()
  if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions() // Android 13+ POST_NOTIFICATIONS prompt
  if (perm.display !== 'granted') return false
  const [hour, minute] = time.split(':').map(Number)
  await LocalNotifications.schedule({
    notifications: [{
      id: ID, title: 'Hymn of the Day', body: 'Your hymn for today is ready.',
      schedule: { on: { hour, minute }, allowWhileIdle: true }, isExactNotification: false,
    }],
  })
  return true
}
