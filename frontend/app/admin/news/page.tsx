'use client'

import { useI18n } from '@/components/providers/I18nProvider'
import { ModulePlaceholder } from '@/components/admin/ModulePlaceholder'

export default function NewsAdminPage() {
  const { t } = useI18n()
  return (
    <ModulePlaceholder
      kind="news"
      note="Le CMS d'actualités (articles, catégories, éditeur riche, brouillons, SEO, traduction FR/EN) est prêt à être branché sur le store. Les routes API et le modèle de données sont en place."
    />
  )
}
