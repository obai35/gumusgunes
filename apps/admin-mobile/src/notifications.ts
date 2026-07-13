import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { api } from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

let lastNotificationResponse: Notifications.NotificationResponse | null = null

export function getLastNotificationResponse() {
  return lastNotificationResponse
}

export function setLastNotificationResponse(response: Notifications.NotificationResponse | null) {
  lastNotificationResponse = response
}

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return null
  }

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

export function createNotificationChannel() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('conversations', {
      name: 'Conversations',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4AF37',
    })
  }
}
