import * as SecureStore from 'expo-secure-store'

export type User = { id: string; email: string; name: string; role: string; permissions: string[] }
export type Conversation = { id: string; customerName: string; status: string; lastMessage: any; updatedAt: string }
export type Message = { id: string; content: string; role: string; createdAt: string }

export async function saveToken(token: string) {
  await SecureStore.setItemAsync('admin_token', token)
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('admin_token')
  } catch {
    return null
  }
}

export async function clearToken() {
  await (SecureStore as any).deleteItemAsync('admin_token')
}

export async function savePushPreferences(prefs: Record<string, any>) {
  await SecureStore.setItemAsync('push_preferences', JSON.stringify(prefs))
}

export async function getPushPreferences(): Promise<Record<string, any> | null> {
  try {
    const data = await SecureStore.getItemAsync('push_preferences')
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}
