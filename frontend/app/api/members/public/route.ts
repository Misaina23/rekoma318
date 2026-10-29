import { NextResponse } from 'next/server'
import { remoteMembers } from '@/lib/server/remote'
import { readJson } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

const FOUNDATIONAL_BUREAU = [
  {
    id: 'gov-1',
    firstName: 'Brillant',
    lastName: 'BOTOMANANGA',
    sex: 'M',
    role: 'Président du Conseil d’Administration',
    designation: 'Président & Co-fondateur',
    description: 'Porteur stratégique et représentant officiel de l’association REKOMA pour le développement de Midongy Atsimo.',
    displayOrder: 1,
    status: 'active',
  },
  {
    id: 'gov-2',
    firstName: 'Nanga Miaramanana',
    lastName: 'ANDRIANISAINA',
    sex: 'M',
    role: 'Coordinateur Général & Lead Développeur',
    designation: 'Coordinateur de projets',
    description: 'Pilotage opérationnel du PDIMA, structuration technique et coordination des partenariats socio-économiques.',
    displayOrder: 2,
    status: 'active',
  },
  {
    id: 'gov-3',
    firstName: 'Nandrianina',
    lastName: 'SANIVOTIANA',
    sex: 'F',
    role: 'Trésorière Générale',
    designation: 'Gestion financière & Budgétaire',
    description: 'Suivi rigoureux de la transparence financière, des dons reçus et des allocations budgétaires du projet PDIMA.',
    displayOrder: 3,
    status: 'active',
  },
  {
    id: 'gov-4',
    firstName: 'Beriat',
    lastName: 'RAKOTOMALALA',
    sex: 'M',
    role: 'Secrétaire Général',
    designation: 'Administration & Registres',
    description: 'Tenue des procès-verbaux, correspondance institutionnelle et suivi des adhésions communautaires.',
    displayOrder: 4,
    status: 'active',
  },
  {
    id: 'gov-5',
    firstName: 'Benjamine',
    lastName: 'VANOHARENA',
    sex: 'F',
    role: 'Responsable Communication & Design',
    designation: 'Designer & Valorisation',
    description: 'Identité visuelle de REKOMA, communication auprès des bénéficiaires et sensibilisation locale.',
    displayOrder: 5,
    status: 'active',
  },
  {
    id: 'gov-6',
    firstName: 'Claude',
    lastName: 'MAUFAZAR',
    sex: 'F',
    role: 'Conseillère Stratégique',
    designation: 'Conseil & Relations Communautaires',
    description: 'Appui consultatif sur les initiatives féminines et l’inclusion des ménages vulnérables de Midongy.',
    displayOrder: 6,
    status: 'active',
  },
  {
    id: 'gov-7',
    firstName: 'Liva',
    lastName: 'RANDRIAMAMPIANINA',
    sex: 'M',
    role: 'Conseiller Technique',
    designation: 'Conseil & Développement rural',
    description: 'Orientation technique sur les filières avicoles, maraîchères et l’approvisionnement en eau potable.',
    displayOrder: 7,
    status: 'active',
  },
  {
    id: 'gov-8',
    firstName: 'Tianjara',
    lastName: 'NANGA',
    sex: 'M',
    role: 'Développeur & Support Technique',
    designation: 'Systèmes & Logistique',
    description: 'Maintenance des outils numériques de terrain et appui logistique du centre polyvalent.',
    displayOrder: 8,
    status: 'active',
  },
  {
    id: 'gov-9',
    firstName: 'Thimote',
    lastName: 'NANGA',
    sex: 'M',
    role: 'Formateur Principal',
    designation: 'Formation & Renforcement des capacités',
    description: 'Animation des ateliers de formation professionnelle, alphabétisation et techniques agropastorales.',
    displayOrder: 9,
    status: 'active',
  },
]

export async function GET() {
  const memberMap = new Map<string, any>()

  // 1. Fetch remote members from backend PostgreSQL
  try {
    const remoteData = await remoteMembers.public()
    if (Array.isArray(remoteData)) {
      for (const m of remoteData) {
        if (m && m.id && m.status !== 'inactive') {
          memberMap.set(m.id, m)
        }
      }
    }
  } catch (e: any) {
    console.warn('remoteMembers.public failed, reading local cache:', e.message)
  }

  // 2. Merge local members created in admin (members.json)
  try {
    const local = await readJson<any[]>('members.json', [])
    for (const m of local) {
      if (m && m.id && m.status !== 'inactive') {
        const existingKey = Array.from(memberMap.keys()).find((k) => {
          const it = memberMap.get(k)
          return (
            it.id === m.id ||
            (`${it.firstName || ''} ${it.lastName || ''}`.trim().toLowerCase() ===
              `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase())
          )
        })
        if (!existingKey) {
          memberMap.set(m.id, m)
        }
      }
    }
  } catch (err: any) {
    console.warn('Error reading local members.json:', err.message)
  }

  // 3. If list is still empty, populate with foundational bureau
  if (memberMap.size === 0) {
    for (const b of FOUNDATIONAL_BUREAU) {
      memberMap.set(b.id, b)
    }
  }

  const result = Array.from(memberMap.values()).sort(
    (a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999) || String(a.lastName || '').localeCompare(String(b.lastName || ''))
  )

  return NextResponse.json(result)
}
