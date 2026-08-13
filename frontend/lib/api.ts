const API_ROOT =
  process.env.NEXT_PUBLIC_API_URL || 'https://rekoma318.onrender.com'

export async function apiFetch(
  path: string,
  opts: RequestInit = {}
) {
  const url = `${API_ROOT}${path}`

  const finalOpts: RequestInit = {
    credentials: 'include',
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
    throw new Error(data.message || data.error || 'Identifiants invalides')
  }

  return res.json()
}

export async function request2FA(email: string, password: string) {
  return apiFetch('/api/verification/2fa/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export async function verify2FA(sessionId: string, code: string) {
  return apiFetch('/api/verification/2fa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, code }),
  })
}

export async function resend2FA(sessionId: string) {
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
