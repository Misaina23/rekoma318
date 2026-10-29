// Thin server-side client that proxies frontend admin/public API routes to the
// Express backend (single source of truth = PostgreSQL). Keeps the admin session
// guard in the frontend while delegating all persistence to the backend.

const API = process.env.NEXT_PUBLIC_API_URL || 'https://rekoma318.onrender.com'

// Maps expired/current access tokens to their refresh tokens and latest renewed access tokens
const refreshByAccess = new Map<string, string>()
const renewedAccessMap = new Map<string, string>()

export function registerRefreshPair(accessToken: string, refreshToken: string) {
  if (!accessToken || !refreshToken) return
  if (refreshByAccess.size > 200) {
    const firstKey = refreshByAccess.keys().next().value
    if (firstKey) refreshByAccess.delete(firstKey)
  }
  refreshByAccess.set(accessToken, refreshToken)
}

function stripBearer(raw?: string | null): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined
  let token = raw.trim()
  while (/^Bearer\s+/i.test(token)) {
    token = token.replace(/^Bearer\s+/i, '').trim()
  }
  token = token.replace(/^["']+|["']+$/g, '').trim()
  if (!token || token === 'undefined' || token === 'null' || token === '[object Object]') {
    return undefined
  }
  return token
}

function normalizeAuthHeader(authHeader?: string | null): string | undefined {
  let raw = authHeader
  if (!raw && typeof window !== 'undefined') {
    try {
      raw = window.localStorage.getItem('rekoma_access_token')
    } catch {
      raw = null
    }
    if (!stripBearer(raw) && typeof document !== 'undefined') {
      const m = document.cookie.match(/(?:^|;\s*)rekoma_access_token=([^;]+)/)
      if (m?.[1]) raw = decodeURIComponent(m[1])
    }
  }
  const clean = stripBearer(raw)
  if (!clean) return undefined
  const renewed = renewedAccessMap.get(clean) || clean
  return `Bearer ${renewed}`
}

function extractSetCookieToken(res: Response, name: string): string | undefined {
  try {
    const headersAny = res.headers as any
    const list: string[] =
      typeof headersAny.getSetCookie === 'function'
        ? headersAny.getSetCookie()
        : res.headers.get('set-cookie')
          ? [res.headers.get('set-cookie') as string]
          : []
    for (const item of list) {
      const m = item.match(new RegExp(`(?:^|,\\s*)${name}=([^;\\s,]+)`))
      if (m?.[1]) {
        const clean = stripBearer(decodeURIComponent(m[1]))
        if (clean) return clean
      }
    }
  } catch {
    // ignore
  }
  return undefined
}

async function tryRefreshAccessToken(oldToken?: string): Promise<string | undefined> {
  const knownRefresh = oldToken ? refreshByAccess.get(oldToken) : undefined
  if (!knownRefresh && typeof window === 'undefined') return undefined

  try {
    const refreshRes = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...(knownRefresh ? { cookie: `refreshToken=${knownRefresh}` } : {}),
      },
      body: JSON.stringify(knownRefresh ? { refreshToken: knownRefresh } : {}),
      cache: 'no-store',
    })
    if (!refreshRes.ok) return undefined
    const body = await refreshRes.json().catch(() => ({}))
    const freshAccess = stripBearer(body?.accessToken) || extractSetCookieToken(refreshRes, 'accessToken')
    const freshRefresh = stripBearer(body?.refreshToken) || extractSetCookieToken(refreshRes, 'refreshToken') || knownRefresh
    if (freshAccess) {
      if (oldToken) renewedAccessMap.set(oldToken, freshAccess)
      if (freshRefresh) registerRefreshPair(freshAccess, freshRefresh)
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('rekoma_access_token', freshAccess)
        } catch {
          // ignore
        }
      }
      return freshAccess
    }
  } catch {
    // ignore refresh failure
  }
  return undefined
}

async function call(path: string, init: RequestInit = {}, authHeader?: string | null) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  const resolvedAuth = normalizeAuthHeader(authHeader)
  const rawToken = stripBearer(resolvedAuth)
  try {
    let res = await fetch(`${API}${path}`, {
      ...init,
      signal: init.signal || controller.signal,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...(init.headers || {}),
        ...(resolvedAuth ? { authorization: resolvedAuth } : {}),
      },
      cache: 'no-store',
    })

    // Transparently refresh expired backend JWT once on 401
    if (res.status === 401 && path !== '/api/auth/refresh' && path !== '/api/auth/login') {
      const freshAccess = await tryRefreshAccessToken(rawToken)
      if (freshAccess) {
        res = await fetch(`${API}${path}`, {
          ...init,
          signal: init.signal || controller.signal,
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
            ...(init.headers || {}),
            authorization: `Bearer ${freshAccess}`,
          },
          cache: 'no-store',
        })
      }
    }

    const text = await res.text()
    let data: any = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = { message: text }
      }
    }
    if (!res.ok) {
      const err = new Error((data && (data.error || data.message)) || `Backend ${res.status}`)
      ;(err as any).status = res.status
      throw err
    }
    return data
  } finally {
    clearTimeout(timeout)
  }
}

function unwrap<T>(data: any): T {
  // Backend returns { success, item|items } or raw arrays. Normalize to payload.
  if (data && typeof data === 'object' && 'success' in data) {
    if ('items' in data) return data.items as T
    if ('item' in data) return data.item as T
    if ('donations' in data) return data as T
    if ('breakdown' in data) return data as T
  }
  return data as T
}

// ---------- Activities ----------
export const remoteActivities = {
  list: (q?: string, status?: string, page?: string, authHeader?: string | null) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (page) params.set('page', page)
    const qs = params.toString()
    return call(`/api/cms/activities${qs ? `?${qs}` : ''}`, {}, authHeader).then((d) => d as any)
  },
  create: (body: any, authHeader?: string | null) => call('/api/cms/activities', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  update: (id: string, body: any, authHeader?: string | null) => call(`/api/cms/activities/${id}`, { method: 'PUT', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  remove: (id: string, authHeader?: string | null) => call(`/api/cms/activities/${id}`, { method: 'DELETE' }, authHeader),
}

// ---------- Formations ----------
export const remoteFormations = {
  list: (q?: string, status?: string, from?: string, to?: string, page?: string, authHeader?: string | null) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (page) params.set('page', page)
    const qs = params.toString()
    return call(`/api/cms/formations${qs ? `?${qs}` : ''}`, {}, authHeader).then((d) => d as any)
  },
  create: (body: any, authHeader?: string | null) => call('/api/cms/formations', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => d as any),
  update: (id: string, body: any, authHeader?: string | null) => call(`/api/cms/formations/${id}`, { method: 'PUT', body: JSON.stringify(body) }, authHeader).then((d) => d as any),
  remove: (id: string, authHeader?: string | null) => call(`/api/cms/formations/${id}`, { method: 'DELETE' }, authHeader),
}

// ---------- Members ----------
export const remoteMembers = {
  list: (q?: string, authHeader?: string | null) => call(`/api/members${q ? `?q=${encodeURIComponent(q)}` : ''}`, {}, authHeader).then((d) => unwrap<any[]>(d)),
  public: (authHeader?: string | null) => call('/api/members/public', {}, authHeader).then((d) => unwrap<any[]>(d)),
  create: (body: any, authHeader?: string | null) => call('/api/members', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  update: (id: string, body: any, authHeader?: string | null) => call(`/api/members/${id}`, { method: 'PUT', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  remove: (id: string, authHeader?: string | null) => call(`/api/members/${id}`, { method: 'DELETE' }, authHeader),
}

// ---------- Donations ----------
export const remoteDonations = {
  list: (status?: string, authHeader?: string | null) => call(`/api/donations${status ? `?status=${status}` : ''}`, {}, authHeader).then((d) => unwrap<{ donations: any[]; totalCollected: number }>(d)),
  update: (id: string, body: any, authHeader?: string | null) => call(`/api/donations/${id}`, { method: 'PUT', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  remove: (id: string, authHeader?: string | null) => call(`/api/donations/${id}`, { method: 'DELETE' }, authHeader),
}

// ---------- Messages (grouped threads) ----------
export const remoteMessages = {
  listThreads: (authHeader?: string | null) => call('/api/messages', {}, authHeader).then((d) => unwrap<any[]>(d)),
  update: (id: string, body: any, authHeader?: string | null) => call(`/api/messages/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  remove: (id: string, authHeader?: string | null) => call(`/api/messages/${id}`, { method: 'DELETE' }, authHeader),
  reply: (id: string, from: string, body: string, authHeader?: string | null) =>
    call(`/api/messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ from, body }) }, authHeader).then((d) => unwrap<any>(d)),
}

// ---------- News / Documents / Gallery / Activities (CMS public + admin) ----------
export const remoteCms = {
  news: (all = false, q?: string, published?: boolean, page?: string, authHeader?: string | null) => {
    const params = new URLSearchParams()
    if (all) params.set('all', '1')
    if (q) params.set('q', q)
    if (published !== undefined) params.set('published', String(published))
    if (page) params.set('page', page)
    const qs = params.toString()
    return call(`/api/cms/news${qs ? `?${qs}` : ''}`, {}, authHeader).then((d) => d as any)
  },
  createNews: (body: any, authHeader?: string | null) => call('/api/cms/news', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  updateNews: (id: string, body: any, authHeader?: string | null) => call(`/api/cms/news/${id}`, { method: 'PUT', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  deleteNews: (id: string, authHeader?: string | null) => call(`/api/cms/news/${id}`, { method: 'DELETE' }, authHeader),

  documents: (all = false, q?: string, category?: string, published?: boolean, page?: string, authHeader?: string | null) => {
    const params = new URLSearchParams()
    if (all) params.set('all', '1')
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    if (published !== undefined) params.set('published', String(published))
    if (page) params.set('page', page)
    const qs = params.toString()
    return call(`/api/cms/documents${qs ? `?${qs}` : ''}`, {}, authHeader).then((d) => d as any)
  },
  createDocument: (body: any, authHeader?: string | null) => call('/api/cms/documents', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  updateDocument: (id: string, body: any, authHeader?: string | null) => call(`/api/cms/documents/${id}`, { method: 'PUT', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  deleteDocument: (id: string, authHeader?: string | null) => call(`/api/cms/documents/${id}`, { method: 'DELETE' }, authHeader),

  gallery: (q?: string, page?: string, authHeader?: string | null) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (page) params.set('page', page)
    const qs = params.toString()
    return call(`/api/cms/gallery${qs ? `?${qs}` : ''}`, {}, authHeader).then((d) => d as any)
  },
  createGalleryEvent: (body: any, authHeader?: string | null) => call('/api/cms/gallery', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  addGalleryPhoto: (id: string, url: string, authHeader?: string | null) => call(`/api/cms/gallery/${id}/photos`, { method: 'POST', body: JSON.stringify({ url }) }, authHeader).then((d) => unwrap<any>(d)),
  deleteGalleryEvent: (id: string, authHeader?: string | null) => call(`/api/cms/gallery/${id}`, { method: 'DELETE' }, authHeader),

  activities: (q?: string, status?: string, page?: string, authHeader?: string | null) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (page) params.set('page', page)
    const qs = params.toString()
    return call(`/api/cms/activities${qs ? `?${qs}` : ''}`, {}, authHeader).then((d) => d as any)
  },
  createActivity: (body: any, authHeader?: string | null) => call('/api/cms/activities', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  updateActivity: (id: string, body: any, authHeader?: string | null) => call(`/api/cms/activities/${id}`, { method: 'PUT', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  removeActivity: (id: string, authHeader?: string | null) => call(`/api/cms/activities/${id}`, { method: 'DELETE' }, authHeader),
}

// ---------- Beneficiaries ----------
export const remoteBeneficiaries = {
  list: (q?: string, category?: string, formationId?: string, status?: string, sex?: string, commune?: string, page?: string, authHeader?: string | null) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    if (formationId) params.set('formationId', formationId)
    if (status) params.set('status', status)
    if (sex) params.set('sex', sex)
    if (commune) params.set('commune', commune)
    if (page) params.set('page', page)
    const qs = params.toString()
    return call(`/api/beneficiaries${qs ? `?${qs}` : ''}`, {}, authHeader).then((d) => d as any)
  },
  stats: (authHeader?: string | null) => call('/api/beneficiaries/stats', {}, authHeader).then((d) => d as any),
  create: (body: any, authHeader?: string | null) => call('/api/beneficiaries', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => d as any),
  update: (id: string, body: any, authHeader?: string | null) => call(`/api/beneficiaries/${id}`, { method: 'PUT', body: JSON.stringify(body) }, authHeader).then((d) => d as any),
  remove: (id: string, authHeader?: string | null) => call(`/api/beneficiaries/${id}`, { method: 'DELETE' }, authHeader),
}

// ---------- Public submissions ----------
export const remotePublic = {
  postMessage: (body: any, authHeader?: string | null) => call('/api/messages', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  postDonation: (body: any, authHeader?: string | null) => call('/api/donations', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  postVisit: (authHeader?: string | null) => call('/api/visits', { method: 'POST' }, authHeader),
  publicStats: () => call('/api/stats/public', {}, null).then((d) => d as any),
}

// ---------- Payments ----------
export const remotePayments = {
  mvolaRequest: (body: any, authHeader?: string | null) => call('/api/mvola/request', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  mvolaStatus: (reference: string, authHeader?: string | null) => call(`/api/mvola/status`, { method: 'POST', body: JSON.stringify({ reference }) }, authHeader).then((d) => unwrap<any>(d)),
  stripeCheckout: (body: any, authHeader?: string | null) => call('/api/stripe/checkout', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
}

// ---------- REKOMA merchandise and orders ----------
export const remoteStore = {
  products: () => call('/api/store/products').then((d) => d as { items: any[] }),
  adminProducts: (authHeader?: string | null) => call('/api/store/products/manage', {}, authHeader).then((d) => d as { items: any[] }),
  createProduct: (body: any, authHeader?: string | null) => call('/api/store/products', { method: 'POST', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  updateProduct: (id: string, body: any, authHeader?: string | null) => call(`/api/store/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, authHeader).then((d) => unwrap<any>(d)),
  orders: (authHeader?: string | null) => call('/api/store/orders', {}, authHeader).then((d) => d as { orders: any[] }),
  createOrder: (body: any) => call('/api/store/orders', { method: 'POST', body: JSON.stringify(body) }).then((d) => d as any),
  updateOrder: (id: string, status: string, authHeader?: string | null) => call(`/api/store/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }, authHeader).then((d) => d as any),
}

export { API }
