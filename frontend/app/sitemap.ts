import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://rekoma-318.vercel.app'
  const routes = ['', '/a-propos', '/pdima', '/impact', '/gouvernance', '/documents', '/actualites', '/contact', '/don']
  const now = new Date()
  return routes.map((r) => ({
    url: `${base}${r}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: r === '' ? 1 : 0.7,
  }))
}
