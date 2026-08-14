const API_ROOT =
  process.env.NEXT_PUBLIC_API_URL || 'https://rekoma318.onrender.com'

export async function apiFetch(
  path: string,
  opts: RequestInit = {}
) {
  const url = `${API_ROOT}${path}`

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('rekoma_access_token') || undefined
      : undefined

  const finalOpts: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    ...opts,
  }

  const res = await fetch(url, finalOpts)

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt || res.statusText)
  }

  return res.json()
}

export async function login(email: string, password: string) {
  console.log('📤 Login request:', { email })
  const res = await fetch(`${API_ROOT}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    console.error('❌ Login failed:', res.status, data)
    throw new Error(data.message || data.error || 'Identifiants invalides')
  }

  const data = await res.json()
  console.log('✅ Login response:', data)
  return data
}

export async function request2FA(email: string, password: string) {
  console.log('📤 Request2FA:', { email })
  return apiFetch('/api/verification/2fa/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export async function verify2FA(sessionId: string, code: string) {
  console.log('📤 Verify2FA:', { sessionId, code })
  return apiFetch('/api/verification/2fa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, code }),
  })
}

export async function resend2FA(sessionId: string) {
  console.log('📤 Resend2FA:', { sessionId })
  return apiFetch('/api/verification/2fa/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
}

export default {
  apiFetch,
  login,
  request2FA,
  verify2FA,
  resend2FA,
}
