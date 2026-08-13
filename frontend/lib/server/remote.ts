// Thin server-side client that proxies frontend admin/public API routes to the
// Express backend (single source of truth = PostgreSQL). Keeps the admin session
// guard in the frontend while delegating all persistence to the backend.

const API = process.env.NEXT_PUBLIC_API_URL || 'https://rekoma318.onrender.com'

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
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
  list: () => call('/api/cms/activities').then((d) => unwrap<any[]>(d)),
  create: (body: any) => call('/api/cms/activities', { method: 'POST', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  update: (id: string, body: any) => call(`/api/cms/activities/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  remove: (id: string) => call(`/api/cms/activities/${id}`, { method: 'DELETE' }),
}

// ---------- Formations ----------
export const remoteFormations = {
  list: () => call('/api/cms/formations').then((d) => unwrap<any[]>(d)),
  create: (body: any) => call('/api/cms/formations', { method: 'POST', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  update: (id: string, body: any) => call(`/api/cms/formations/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  remove: (id: string) => call(`/api/cms/formations/${id}`, { method: 'DELETE' }),
}

// ---------- Members ----------
export const remoteMembers = {
  list: (q?: string) => call(`/api/members${q ? `?q=${encodeURIComponent(q)}` : ''}`).then((d) => unwrap<any[]>(d)),
  public: () => call('/api/members/public').then((d) => unwrap<any[]>(d)),
  create: (body: any) => call('/api/members', { method: 'POST', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  update: (id: string, body: any) => call(`/api/members/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  remove: (id: string) => call(`/api/members/${id}`, { method: 'DELETE' }),
}

// ---------- Donations ----------
export const remoteDonations = {
  list: (status?: string) => call(`/api/donations${status ? `?status=${status}` : ''}`).then((d) => unwrap<{ donations: any[]; totalCollected: number }>(d)),
  update: (id: string, body: any) => call(`/api/donations/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  remove: (id: string) => call(`/api/donations/${id}`, { method: 'DELETE' }),
}

// ---------- Messages (grouped threads) ----------
export const remoteMessages = {
  listThreads: () => call('/api/messages').then((d) => unwrap<any[]>(d)),
  update: (id: string, body: any) => call(`/api/messages/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  remove: (id: string) => call(`/api/messages/${id}`, { method: 'DELETE' }),
  reply: (id: string, from: string, body: string) =>
    call(`/api/messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ from, body }) }).then((d) => unwrap<any>(d)),
}

// ---------- News / Documents / Gallery (CMS public + admin) ----------
export const remoteCms = {
  news: (all = false) => call(`/api/cms/news${all ? '?all=1' : ''}`).then((d) => unwrap<any[]>(d)),
  createNews: (body: any) => call('/api/cms/news', { method: 'POST', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  updateNews: (id: string, body: any) => call(`/api/cms/news/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  deleteNews: (id: string) => call(`/api/cms/news/${id}`, { method: 'DELETE' }),

  documents: (all = false) => call(`/api/cms/documents${all ? '?all=1' : ''}`).then((d) => unwrap<any[]>(d)),
  createDocument: (body: any) => call('/api/cms/documents', { method: 'POST', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  updateDocument: (id: string, body: any) => call(`/api/cms/documents/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  deleteDocument: (id: string) => call(`/api/cms/documents/${id}`, { method: 'DELETE' }),

  gallery: () => call('/api/cms/gallery').then((d) => unwrap<any[]>(d)),
  createGalleryEvent: (body: any) => call('/api/cms/gallery', { method: 'POST', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  addGalleryPhoto: (id: string, url: string) => call(`/api/cms/gallery/${id}/photos`, { method: 'POST', body: JSON.stringify({ url }) }).then((d) => unwrap<any>(d)),
  deleteGalleryEvent: (id: string) => call(`/api/cms/gallery/${id}`, { method: 'DELETE' }),
}

// ---------- Beneficiaries ----------
export const remoteBeneficiaries = {
  list: (q?: string, category?: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    const qs = params.toString()
    return call(`/api/beneficiaries${qs ? `?${qs}` : ''}`).then((d) => unwrap<any[]>(d))
  },
  stats: () => call('/api/beneficiaries/stats').then((d) => unwrap<{ total: number; breakdown: Record<string, number> }>(d)),
  create: (body: any) => call('/api/beneficiaries', { method: 'POST', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  update: (id: string, body: any) => call(`/api/beneficiaries/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  remove: (id: string) => call(`/api/beneficiaries/${id}`, { method: 'DELETE' }),
}

// ---------- Public submissions ----------
export const remotePublic = {
  postMessage: (body: any) => call('/api/messages', { method: 'POST', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  postDonation: (body: any) => call('/api/donations', { method: 'POST', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  postVisit: () => call('/api/visits', { method: 'POST' }),
}

// ---------- Payments ----------
export const remotePayments = {
  mvolaRequest: (body: any) => call('/api/mvola/request', { method: 'POST', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
  mvolaStatus: (reference: string) => call(`/api/mvola/status`, { method: 'POST', body: JSON.stringify({ reference }) }).then((d) => unwrap<any>(d)),
  stripeCheckout: (body: any) => call('/api/stripe/checkout', { method: 'POST', body: JSON.stringify(body) }).then((d) => unwrap<any>(d)),
}

export { API }
