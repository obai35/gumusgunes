import { Platform } from 'react-native'
import { api } from './api'
import { getPushPreferences } from './store'

async function getNotifModule() {
  try {
    return await import('expo-notifications')
  } catch {
    return null
  }
}

async function getDeviceModule() {
  try {
    return await import('expo-device')
  } catch {
    return null
  }
}

let lastNotificationResponse: any = null

export function getLastNotificationResponse() {
  return lastNotificationResponse
}

export function setLastNotificationResponse(response: any) {
  lastNotificationResponse = response
}

export async function setupNotificationHandler() {
  const Notifications = await getNotifModule()
  if (!Notifications) return

  Notifications.setNotificationHandler({
    handleNotification: async () => {
      try {
        const prefs = await getPushPreferences()
        const now = new Date()
        const hours = now.getHours().toString().padStart(2, '0')
        const minutes = now.getMinutes().toString().padStart(2, '0')
        const current = `${hours}:${minutes}`

        let showAlert = true
        if (prefs?.quietHoursEnabled) {
          if (current >= prefs.quietHoursFrom || current < prefs.quietHoursTo) {
            showAlert = false
          }
        }

        return {
          shouldShowAlert: showAlert,
          shouldPlaySound: showAlert && (prefs?.sound ?? true),
          shouldSetBadge: true,
        }
      } catch {
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }
      }
    },
  })
}

export async function registerForPushNotifications() {
  const Notifications = await getNotifModule()
  const Device = await getDeviceModule()
  if (!Notifications || !Device) return null

  if (!Device.isDevice) return null

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  try {
    const projectId = '66601809-ac07-42bd-8685-5e54a1dc3000'
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    await api.registerPushToken(token, Platform.OS)
    return token
  } catch {
    return null
  }
}

export async function unregisterPushToken(token: string) {
  try {
    await api.unregisterPushToken(token)
  } catch {}
}

export async function createNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return

  const Notifications = await getNotifModule()
  if (!Notifications) return

  try {
    await Notifications.setNotificationChannelAsync('conversations', {
      name: 'Conversations',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4AF37',
    })
  } catch {}
}
