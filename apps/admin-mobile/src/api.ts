const BASE = 'https://gumusgunes.vercel.app'

let secureStore: any = null

async function getSecureStore() {
  if (!secureStore) {
    const mod = await import('expo-secure-store')
    secureStore = mod
  }
  return secureStore
}

async function getToken(): Promise<string | null> {
  try {
    const store = await getSecureStore()
    return await store.getItemAsync('admin_token')
  } catch {
    return null
  }
}

async function request(path: string, options: RequestInit = {}) {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Invalid credentials')
    const data = await res.json()

    const store = await getSecureStore()
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) {
      const match = setCookie.match(/__session_admin=([^;]+)/)
      if (match) {
        await store.setItemAsync('admin_token', match[1])
      }
    }

    return data
  },

  getConversations: (status?: string) =>
    request(`/api/admin/conversations${status ? `?status=${status}` : ''}`),

  getConversation: (id: string) =>
    request(`/api/admin/conversations/${id}`),

  claimConversation: (id: string) =>
    request(`/api/admin/conversations/${id}/claim`, { method: 'POST' }),

  sendMessage: (conversationId: string, message: string) =>
    request('/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ conversationId, message }),
    }),

  closeConversation: (id: string) =>
    request(`/api/admin/conversations/${id}/close`, { method: 'POST' }),
}
