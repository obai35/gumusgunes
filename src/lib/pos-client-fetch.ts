let legacyTokenWiped = false

export function wipeLegacyPosToken(): void {
  if (legacyTokenWiped || typeof window === 'undefined') return
  legacyTokenWiped = true
  try {
    window.localStorage.removeItem('gg_pos_auth')
  } catch {}
}

export async function posFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  wipeLegacyPosToken()
  return fetch(input, init)
}