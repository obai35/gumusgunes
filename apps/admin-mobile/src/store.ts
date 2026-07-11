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
  await SecureStore.removeItemAsync('admin_token')
}
