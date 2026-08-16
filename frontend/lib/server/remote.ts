// Thin server-side client that proxies frontend admin/public API routes to the
// Express backend (single source of truth = PostgreSQL). Keeps the admin session
// guard in the frontend while delegating all persistence to the backend.

const API = process.env.NEXT_PUBLIC_API_URL || 'https://rekoma318.onrender.com'

async function call(path: string, init: RequestInit = {}, authHeader?: string | null) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
      ...(authHeader ? { authorization: authHeader } : {}),
    },
    cache: 'no-store',
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || `Backend ${res.status}`)
    ;(err as any).status = res.status
    throw err
  }
  return data
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

export { API }
