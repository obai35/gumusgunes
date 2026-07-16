import { api } from './api'
import { getPushPreferences } from './store'

let lastNotificationResponse: any = null

export function getLastNotificationResponse() {
  return lastNotificationResponse
}

export function setLastNotificationResponse(response: any) {
  lastNotificationResponse = response
}

export async function setupNotificationHandler() {}

export async function registerForPushNotifications() {
  return null
}

export async function unregisterPushToken(token: string) {
  try {
    await api.unregisterPushToken(token)
  } catch {}
}

export async function createNotificationChannel(): Promise<void> {}
