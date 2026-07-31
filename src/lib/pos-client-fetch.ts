export function readPosToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('gg_pos_auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { token?: unknown } }
    const token = parsed?.state?.token
    return typeof token === 'string' && token.length > 0 ? token : null
  } catch {
    return null
  }
}

export async function posFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const token = readPosToken()
  const headers = new Headers(init?.headers)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers })
}
