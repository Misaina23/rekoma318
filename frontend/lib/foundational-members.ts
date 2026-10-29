export type FoundationalMember = {
  firstName: string
  lastName: string
  sex: 'M' | 'F'
  role: string
  designation: string
  description: string
  displayOrder: number
  status: 'active' | 'inactive'
}

export const FOUNDATIONAL_BUREAU: FoundationalMember[] = [
  {
    firstName: 'Brillant',
    lastName: 'BOTOMANANGA',
    sex: 'M',
    role: 'Président du Conseil d’Administration',
    designation: 'Président & Co-fondateur',
    description:
      'Porteur stratégique et représentant officiel de l’association REKOMA pour le développement de Midongy Atsimo.',
    displayOrder: 1,
    status: 'active',
  },
  {
    firstName: 'Nanga Miaramanana',
    lastName: 'ANDRIANISAINA',
    sex: 'M',
    role: 'Coordinateur Général & Lead Développeur',
    designation: 'Coordinateur de projets',
    description:
      'Pilotage opérationnel du PDIMA, structuration technique et coordination des partenariats socio-économiques.',
    displayOrder: 2,
    status: 'active',
  },
  {
    firstName: 'Nandrianina',
    lastName: 'SANIVOTIANA',
    sex: 'F',
    role: 'Trésorière Générale',
    designation: 'Gestion financière & Budgétaire',
    description:
      'Suivi rigoureux de la transparence financière, des dons reçus et des allocations budgétaires du projet PDIMA.',
    displayOrder: 3,
    status: 'active',
  },
  {
    firstName: 'Beriat',
    lastName: 'RAKOTOMALALA',
    sex: 'M',
    role: 'Secrétaire Général',
    designation: 'Administration & Registres',
    description:
      'Tenue des procès-verbaux, correspondance institutionnelle et suivi des adhésions communautaires.',
    displayOrder: 4,
    status: 'active',
  },
  {
    firstName: 'Benjamine',
    lastName: 'VANOHARENA',
    sex: 'F',
    role: 'Responsable Communication & Design',
    designation: 'Designer & Valorisation',
    description:
      'Identité visuelle de REKOMA, communication auprès des bénéficiaires et sensibilisation locale.',
    displayOrder: 5,
    status: 'active',
  },
  {
    firstName: 'Claude',
    lastName: 'MAUFAZAR',
    sex: 'F',
    role: 'Conseillère Stratégique',
    designation: 'Conseil & Relations Communautaires',
    description:
      'Appui consultatif sur les initiatives féminines et l’inclusion des ménages vulnérables de Midongy.',
    displayOrder: 6,
    status: 'active',
  },
  {
    firstName: 'Liva',
    lastName: 'RANDRIAMAMPIANINA',
    sex: 'M',
    role: 'Conseiller Technique',
    designation: 'Conseil & Développement rural',
    description:
      'Orientation technique sur les filières avicoles, maraîchères et l’approvisionnement en eau potable.',
    displayOrder: 7,
    status: 'active',
  },
  {
    firstName: 'Tianjara',
    lastName: 'NANGA',
    sex: 'M',
    role: 'Développeur & Support Technique',
    designation: 'Systèmes & Logistique',
    description:
      'Maintenance des outils numériques de terrain et appui logistique du centre polyvalent.',
    displayOrder: 8,
    status: 'active',
  },
  {
    firstName: 'Thimote',
    lastName: 'NANGA',
    sex: 'M',
    role: 'Formateur Principal',
    designation: 'Formation & Renforcement des capacités',
    description:
      'Animation des ateliers de formation professionnelle, alphabétisation et techniques agropastorales.',
    displayOrder: 9,
    status: 'active',
  },
]
