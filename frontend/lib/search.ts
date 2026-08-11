export type SearchEntry = {
  href: string
  fr: string
  en: string
  keywords: string
}

export const searchIndex: SearchEntry[] = [
  { href: '/', fr: 'Accueil', en: 'Home', keywords: 'accueil home rekoma presentation' },
  { href: '/a-propos', fr: 'À propos', en: 'About', keywords: 'histoire mission vision valeurs zone' },
  { href: '/pdima', fr: 'Projet PDIMA', en: 'PDIMA Project', keywords: 'pdima developpement integre axes agriculture eau formation transport kpsv avicole' },
  { href: '/impact', fr: 'Impact', en: 'Impact', keywords: 'impact beneficiaires emplois formes eau menages' },
  { href: '/gouvernance', fr: 'Gouvernance', en: 'Governance', keywords: 'bureau executif fondateur president secretaire tresoriere conseiller' },
  { href: '/documents', fr: 'Documents', en: 'Documents', keywords: 'statuts pv procede verbal rapport pdf' },
  { href: '/contact', fr: 'Contact', en: 'Contact', keywords: 'contact email telephone adresse messages' },
  { href: '/don', fr: 'Faire un don', en: 'Donate', keywords: 'don soutenir donation stripe mvola' },
  { href: '/faq', fr: 'FAQ', en: 'FAQ', keywords: 'question frequente faq aide' },
]
