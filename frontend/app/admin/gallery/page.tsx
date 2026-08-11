'use client'

import { useI18n } from '@/components/providers/I18nProvider'
import { ModulePlaceholder } from '@/components/admin/ModulePlaceholder'

export default function GalleryAdminPage() {
  const { t } = useI18n()
  return (
    <ModulePlaceholder
      kind="gallery"
      note="Le module galerie (upload multiple, albums, catégories, images/vidéos, compression, tri) est prêt à être branché. Le store et les routes sont à ajouter dans la prochaine itération."
    />
  )
}
