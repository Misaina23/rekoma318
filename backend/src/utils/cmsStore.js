import fs from 'fs'
import path from 'path'

const dataDir = path.resolve(process.cwd(), 'backend', 'data')
const cmsFile = path.join(dataDir, 'cms.json')
const defaultCms = {
  cms: {
    news: [
      {
        id: 'news-1',
        date: '2026-08-05',
        title: { fr: 'Lancement de REKOMA' },
        excerpt: { fr: 'Bienvenue sur le nouveau site REKOMA : frontend Next.js et backend Express + Prisma.' },
        tag: { fr: 'Annonce' },
        image: '',
      },
    ],
    documents: [
      {
        id: 'doc-1',
        title: { fr: 'Statuts de l\'association' },
        url: '#',
      },
    ],
    gallery: [
      {
        id: 'gallery-1',
        title: { fr: 'Photo d\'inauguration' },
        url: '#',
      },
    ],
    pages: [
      {
        id: 'page-1',
        title: { fr: 'À propos de REKOMA' },
        content: { fr: 'REKOMA est une association dédiée à la concertation, l\'information et la mobilisation locale.' },
      },
    ],
  },
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
}

export function readCms() {
  ensureDataDir()
  if (!fs.existsSync(cmsFile)) {
    fs.writeFileSync(cmsFile, JSON.stringify(defaultCms, null, 2))
  }
  const raw = fs.readFileSync(cmsFile, 'utf8')
  try {
    return JSON.parse(raw)
  } catch {
    return defaultCms
  }
}

export function writeCms(data) {
  ensureDataDir()
  fs.writeFileSync(cmsFile, JSON.stringify(data, null, 2))
}
