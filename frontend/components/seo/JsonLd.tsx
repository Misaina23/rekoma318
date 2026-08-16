export function JsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': ['Organization'],
    name: 'REKOMA',
    alternateName: 'Regroupement des Komarady Objectiviste de Midongy Atsimo',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://rekoma-318.vercel.app',
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
