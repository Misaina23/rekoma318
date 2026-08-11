export function JsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': ['Organization'],
    name: 'REKOMA',
    alternateName: 'Regroupement des Kidabo Opportunistes de Midongy Atsimo',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    logo: '/logo.png',
    description:
      'Association communautaire à but non lucratif située à Midongy Atsimo, Madagascar.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Midongy Atsimo',
      addressRegion: 'Atsimo-Atsinanana',
      addressCountry: 'MG',
    },
    areaServed: 'Midongy Atsimo, Madagascar',
    founder: { '@type': 'Person', name: 'BOTOMANANGA Brillant' },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
