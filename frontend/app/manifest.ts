import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'REKOMA — Midongy Atsimo',
    short_name: 'REKOMA',
    description:
      'REKOMA — Regroupement des Kidabo Opportunistes de Midongy Atsimo. Développement durable et inclusif.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf7',
    theme_color: '#1f7a4d',
    icons: [{ src: '/logo.png', sizes: 'any', type: 'image/png' }],
  }
}
