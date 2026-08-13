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
    throw new Error(data.message || 'Identifiants invalides')
  }

  return res.json()
}

export default {
  apiFetch,
  login,
}