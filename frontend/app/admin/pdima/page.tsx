'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Layers,
  CalendarClock,
  Store,
  Bike,
  Building2,
  Egg,
  Sprout,
  GraduationCap,
  Droplets,
  Lock,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Users,
  Compass,
} from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const AXES_DATA = [
  {
    n: 1,
    title: 'Magasin de proximité et commerce solidaire',
    sector: 'Commerce & Approvisionnement',
    icon: Store,
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    summary: 'Approvisionnement régulier en denrées et biens de première nécessité pour briser les pénuries chroniques dues à l’enclavement.',
    targets: 'Prix régulés, approvisionnement sécurisé pour 5 000+ habitants, fonds de roulement autonome.',
    moduleHref: '/admin/orders',
    moduleLabel: 'Suivi commandes & stocks',
  },
  {
    n: 2,
    title: 'Transport et logistique rurale',
    sector: 'Mobilité & Désenclavement',
    icon: Bike,
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    summary: 'Mise en place de moyens motorisés et logistiques adaptés aux pistes difficiles pour acheminer marchandises et personnes.',
    targets: 'Rotations hebdomadaires régulières, désenclavement des zones rurales isolées, réduction des coûts de fret.',
    moduleHref: '/admin/activities',
    moduleLabel: 'Planning des rotations',
  },
  {
    n: 3,
    title: 'Réhabilitation et valorisation du Centre KPSV',
    sector: 'Infrastructures & Patrimoine',
    icon: Building2,
    badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
    summary: 'Rénovation du patrimoine communautaire KPSV pour en faire le cœur logistique, administratif et de formation de REKOMA.',
    targets: 'Espaces de stockage, bureaux administratifs, salles de cours et accueil communautaire opérationnels.',
    moduleHref: '/admin/documents',
    moduleLabel: 'Dossiers & Plans',
  },
  {
    n: 4,
    title: 'Élevage avicole & sécurité alimentaire',
    sector: 'Sécurité alimentaire & Protéines',
    icon: Egg,
    badgeColor: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
    summary: 'Unité avicole de poulets de chair (500 à 1 000 têtes/bande sur 6 à 7 cycles annuels) pour combler le déficit en protéines.',
    targets: 'Production continue de viande blanche à tarif abordable, valorisation des fientes en fertilisant organique.',
    moduleHref: '/admin/beneficiaries',
    moduleLabel: 'Éleveurs partenaires',
  },
  {
    n: 5,
    title: 'Agriculture agroécologique et maraîchage (SRI)',
    sector: 'Agroécologie & Maraîchage',
    icon: Sprout,
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    summary: 'Pratiques rizicoles améliorées (SRI), maraîchage diversifié, irrigation localisée et semences certifiées.',
    targets: '−40 % de pénurie de légumes sur les marchés, rendements rizicoles doublés sans intrants chimiques néfastes.',
    moduleHref: '/admin/beneficiaries',
    moduleLabel: 'Producteurs & parcelles',
  },
  {
    n: 6,
    title: 'Centre de formation et renforcement des capacités',
    sector: 'Compétences & Formation',
    icon: GraduationCap,
    badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
    summary: 'Sessions qualifiantes en agroécologie, gestion de micro-entreprises, bureautique de base et hygiène WASH.',
    targets: '100 à 150 personnes certifiées par an, ciblage prioritaire des jeunes et des femmes.',
    moduleHref: '/admin/formations',
    moduleLabel: 'Gestion des sessions',
  },
  {
    n: 7,
    title: 'Service d’eau potable et assainissement (WASH)',
    sector: 'Eau & Santé communautaire',
    icon: Droplets,
    badgeColor: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
    summary: 'Forage et borne-fontaine solaire, structuration d’un Comité de Gestion Communautaire de l’Eau (CGCE).',
    targets: '500 à 800 ménages desservis en eau potable salubre, réduction des maladies hydriques.',
    moduleHref: '/admin/beneficiaries',
    moduleLabel: 'Ménages bénéficiaires',
  },
]

const PHASES_DATA = [
  {
    id: 'phase-1',
    name: 'Phase I — Démarrage & Aménagement',
    months: 'Mois 1 à 6',
    status: 'en_cours',
    statusLabel: 'En cours d’exécution',
    items: [
      { text: 'Formalisation juridique et administrative officielle de REKOMA', done: true },
      { text: 'Études techniques (hydrogéologie, diagnostic KPSV, foncier)', done: true },
      { text: 'Lancement des travaux de réhabilitation du Centre KPSV', done: false },
      { text: 'Installation de la borne-fontaine et système de pompage eau potable', done: false },
      { text: 'Acquisition des équipements de transport et logistique de base', done: false },
      { text: 'Ouverture du magasin solidaire de proximité', done: false },
    ],
  },
  {
    id: 'phase-2',
    name: 'Phase II — Opérationnalisation & Consolidation',
    months: 'Mois 7 à 18',
    status: 'planifie',
    statusLabel: 'Planifiée',
    items: [
      { text: 'Lancement du 1er cycle de production avicole (500 poulets)', done: false },
      { text: 'Mise en place des parcelles témoins maraîchères et parcelles SRI', done: false },
      { text: 'Démarrage du programme de formation continue (100+ inscrits)', done: false },
      { text: 'Structuration du Comité de Gestion Communautaire de l’Eau (CGCE)', done: false },
      { text: 'Régularisation des rotations logistiques hebdomadaires', done: false },
    ],
  },
  {
    id: 'phase-3',
    name: 'Phase III — Autonomie & Pérennisation',
    months: 'Mois 19 à 36',
    status: 'planifie',
    statusLabel: 'Planifiée',
    items: [
      { text: 'Augmentation de la capacité avicole à 1 000 têtes/bande', done: false },
      { text: 'Autofinancement de 70 % des coûts de fonctionnement par les activités', done: false },
      { text: 'Certification et insertion économique de 150+ jeunes et femmes', done: false },
      { text: 'Consolidation du fonds de réserve pour maintenance des équipements', done: false },
      { text: 'Bilan triennal d’impact et transfert de gouvernance locale', done: false },
    ],
  },
]

export default function AdminPdimaPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState<'axes' | 'calendar' | 'sustainability'>('axes')
  const [phases, setPhases] = useState(PHASES_DATA)

  function toggleMilestone(phaseIdx: number, itemIdx: number) {
    setPhases((prev) => {
      const copy = [...prev]
      const phase = { ...copy[phaseIdx] }
      const items = [...phase.items]
      items[itemIdx] = { ...items[itemIdx], done: !items[itemIdx].done }
      phase.items = items
      copy[phaseIdx] = phase
      return copy
    })
  }

  function exportCadre() {
    const lines = [
      'REKOMA — CADRE OPÉRATIONNEL INTERNE DU PROJET PDIMA',
      'Document confidentiel réservé à l’équipe de coordination et de pilotage',
      'Date d’export: ' + new Date().toLocaleDateString('fr-FR'),
      '',
      '--- LES 7 GRANDS AXES STRATÉGIQUES ---',
      ...AXES_DATA.map((a) => `[Axe ${a.n}] ${a.title} (${a.sector})\nObjectifs: ${a.targets}\nRésumé: ${a.summary}\n`),
      '--- CALENDRIER DES PHASES ---',
      ...phases.flatMap((ph) => [
        `\n${ph.name} (${ph.months}) - Statut: ${ph.statusLabel}`,
        ...ph.items.map((it) => `  [${it.done ? 'X' : ' '}] ${it.text}`),
      ]),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rekoma-pdima-cadre-interne.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Top banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold sm:text-2xl">Projet PDIMA — Cadre Interne</h1>
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1 text-[11px]">
              <Lock className="h-3 w-3" /> Espace Interne REKOMA
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Pilotage stratégique des 7 grands axes opérationnels et du calendrier des phases (réservé à l’équipe de coordination).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCadre}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exporter le cadre
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab('axes')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'axes'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Layers className="h-4 w-4" />
          Les 7 Grands Axes
        </button>
        <button
          onClick={() => setTab('calendar')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'calendar'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <CalendarClock className="h-4 w-4" />
          Calendrier des Phases
        </button>
        <button
          onClick={() => setTab('sustainability')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'sustainability'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Compass className="h-4 w-4" />
          Pérennité & Modèle
        </button>
      </div>

      {/* TAB 1: 7 Grands Axes */}
      {tab === 'axes' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AXES_DATA.map((axe) => {
            const Icon = axe.icon
            return (
              <Card key={axe.n} className="flex flex-col justify-between border-border/80 transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <Badge variant="outline" className={cn('text-xs font-semibold', axe.badgeColor)}>
                      Axe 0{axe.n}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-base font-semibold leading-snug">{axe.title}</CardTitle>
                  <p className="text-xs font-medium text-muted-foreground">{axe.sector}</p>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 text-xs">
                  <p className="text-muted-foreground leading-relaxed">{axe.summary}</p>
                  <div className="rounded-lg bg-secondary/50 p-2.5">
                    <span className="font-semibold text-foreground">Cibles opérationnelles : </span>
                    <span className="text-muted-foreground">{axe.targets}</span>
                  </div>
                  <div className="pt-1">
                    <Link
                      href={axe.moduleHref}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      {axe.moduleLabel}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* TAB 2: Calendrier des Phases */}
      {tab === 'calendar' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ce calendrier interne permet à l’équipe de suivre l’état d’avancement de chaque jalon opérationnel. Cliquez sur une case pour marquer une étape comme réalisée.
            </p>
          </div>
          <div className="space-y-5">
            {phases.map((ph, phIdx) => (
              <Card key={ph.id} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
                        {phIdx + 1}
                      </span>
                      <div>
                        <CardTitle className="text-base font-semibold">{ph.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{ph.months}</p>
                      </div>
                    </div>
                    <Badge variant={ph.status === 'en_cours' ? 'default' : 'outline'}>
                      {ph.statusLabel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ph.items.map((it, itIdx) => (
                      <button
                        key={it.text}
                        type="button"
                        onClick={() => toggleMilestone(phIdx, itIdx)}
                        className={cn(
                          'flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors',
                          it.done
                            ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                            : 'border-border bg-card hover:bg-secondary/40 text-muted-foreground'
                        )}
                      >
                        {it.done ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className={cn('text-xs leading-relaxed', it.done && 'line-through text-muted-foreground')}>
                          {it.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Pérennité & Modèle */}
      {tab === 'sustainability' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modèle d’autofinancement progressif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                Contrairement à une logique d’assistance permanente, le PDIMA est conçu autour d’activités génératrices de revenus (magasin solidaire, vente avicole, ateliers de production) réinjectant 100 % des excédents dans les services sociaux et l’eau potable.
              </p>
              <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
                <p className="font-semibold text-foreground">Objectif triennal :</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Année 1 : 25 % d’autofinancement (lancement et investissements)</li>
                  <li>Année 2 : 50 % d’autofinancement (vitesse de croisière avicole et magasin)</li>
                  <li>Année 3 : 70 %+ d’autonomie opérationnelle complète</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gouvernance & Implication locale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                La gestion de chaque axe repose sur un binôme associatif-communautaire (Comités villageois de l’eau, groupements d’éleveurs et de producteurs maraîchers).
              </p>
              <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
                <p className="font-semibold text-foreground">Comités spécialisés :</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Comité de Gestion Communautaire de l’Eau (CGCE)</li>
                  <li>Commission Approvisionnement & Tarifs Magasin</li>
                  <li>Conseil Pédagogique du Centre de Formation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
