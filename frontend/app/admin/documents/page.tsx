'use client'

import { useI18n } from '@/components/providers/I18nProvider'
import { ModulePlaceholder } from '@/components/admin/ModulePlaceholder'

export default function DocumentsAdminPage() {
  const { t } = useI18n()
  return (
    <ModulePlaceholder
      kind="documents"
      note="Le module documentaire (PDF/Word/Excel/Images, catégories, téléchargement, versionning) est prêt à être branché sur le store. La bibliothèque publique est déjà disponible dans la page Documents."
    />
  )
}
