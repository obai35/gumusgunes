const BASE = 'https://gumusgunes.vercel.app'

let secureStore: any = null

export async function getSecureStore() {
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

async function request(path: string, options: RequestInit = {}, timeout = 15000) {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(`${BASE}${path}`, { ...options, headers, signal: controller.signal })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || 'Request failed')
    }
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

export const api = {
  login: async (email: string, password: string) => {
    const res = await fetchWithTimeout(`${BASE}/api/admin/auth/login`, {
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

    if (data.user) {
      await store.setItemAsync('admin_email', data.user.email || '')
      await store.setItemAsync('admin_name', data.user.name || '')
      await store.setItemAsync('admin_role', data.user.role || '')
      await store.setItemAsync('admin_permissions', JSON.stringify(data.user.permissions || []))
    }

    return data
  },

  getConversations: (status?: string, source?: string) => {
    const qs: string[] = []
    if (status) qs.push(`status=${encodeURIComponent(status)}`)
    if (source && source !== 'all') qs.push(`source=${encodeURIComponent(source)}`)
    return request(`/api/admin/conversations${qs.length ? `?${qs.join('&')}` : ''}`)
  },

  getConversation: (id: string) =>
    request(`/api/admin/conversations/${id}`),

  claimConversation: (id: string) =>
    request(`/api/admin/conversations/${id}/claim`, { method: 'POST' }),

  sendMessage: (conversationId: string, message: string) =>
    request('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({ conversationId, message }),
    }),

  closeConversation: (id: string) =>
    request(`/api/admin/conversations/${id}/close`, { method: 'POST' }),

  registerPushToken: (token: string, platform: string) =>
    request('/api/admin/push/register', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    }),

  unregisterPushToken: (token: string) =>
    request('/api/admin/push/unregister', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
}
