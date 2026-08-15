import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  const email = 'andrianisaina23@gmail.com'
  const plain = '2311saina!'
  const hashed = await bcrypt.hash(plain, 12)

  await prisma.user.upsert({
    where: { email },
    update: { emailVerified: true },
    create: {
      email,
      password: hashed,
      role: 'super_admin',
      name: 'Super Admin',
      emailVerified: true,
    },
  })

  const roles = [
    { name: 'super_admin', label: 'Super Administrateur', description: 'Accès complet', isSystem: true },
    { name: 'admin', label: 'Administrateur', description: 'Gestion générale', isSystem: true },
    { name: 'manager', label: 'Gestionnaire', description: 'Gestion opérationnelle', isSystem: true },
    { name: 'editor', label: 'Éditeur', description: 'Contenu', isSystem: true },
    { name: 'formation_lead', label: 'Responsable Formation', description: 'Formations', isSystem: true },
    { name: 'finance_lead', label: 'Responsable Finance', description: 'Dons et finances', isSystem: true },
    { name: 'communication_lead', label: 'Responsable Communication', description: 'Communication', isSystem: true },
    { name: 'viewer', label: 'Observateur', description: 'Lecture seule', isSystem: true },
  ]

  const createdRoles = {}
  for (const r of roles) {
    const role = await prisma.role.upsert({ where: { name: r.name }, update: r, create: r })
    createdRoles[r.name] = role
  }

  const permissions = [
    { key: 'view_dashboard', label: 'Tableau de bord', category: 'dashboard' },
    { key: 'members.view', label: 'Voir les membres', category: 'members' },
    { key: 'members.create', label: 'Créer des membres', category: 'members' },
    { key: 'members.edit', label: 'Modifier des membres', category: 'members' },
    { key: 'members.delete', label: 'Supprimer des membres', category: 'members' },
    { key: 'manage_members', label: 'Gérer les membres', category: 'members' },
    { key: 'manage_activities', label: 'Gérer les activités', category: 'activities' },
    { key: 'manage_formations', label: 'Gérer les formations', category: 'formations' },
    { key: 'manage_donations', label: 'Gérer les dons', category: 'donations' },
    { key: 'manage_news', label: 'Gérer les actualités', category: 'news' },
    { key: 'manage_gallery', label: 'Gérer la galerie', category: 'gallery' },
    { key: 'manage_documents', label: 'Gérer les documents', category: 'documents' },
    { key: 'manage_messages', label: 'Gérer les messages', category: 'messages' },
    { key: 'messages.reply', label: 'Répondre aux messages', category: 'messages' },
    { key: 'manage_beneficiaries', label: 'Gérer les bénéficiaires', category: 'beneficiaries' },
    { key: 'view_analytics', label: 'Voir les analytiques', category: 'analytics' },
    { key: 'manage_settings', label: 'Gérer les paramètres', category: 'settings' },
    { key: 'manage_roles', label: 'Gérer les rôles', category: 'settings' },
  ]

  const createdPerms = {}
  for (const p of permissions) {
    const perm = await prisma.permission.upsert({ where: { key: p.key }, update: p, create: p })
    createdPerms[p.key] = perm
  }

  const rolePerms = {
    super_admin: Object.keys(createdPerms),
    admin: Object.keys(createdPerms).filter(k => k !== 'manage_roles'),
    manager: [
      'view_dashboard',
      'members.view',
      'members.create',
      'members.edit',
      'members.delete',
      'manage_members',
      'manage_activities',
      'manage_formations',
      'manage_donations',
      'manage_news',
      'manage_gallery',
      'manage_documents',
      'manage_messages',
      'messages.reply',
      'manage_beneficiaries',
      'view_analytics',
    ],
    editor: ['view_dashboard', 'manage_news', 'manage_gallery', 'manage_documents'],
    formation_lead: ['view_dashboard', 'manage_formations', 'view_analytics'],
    finance_lead: ['view_dashboard', 'manage_donations', 'view_analytics', 'manage_settings'],
    communication_lead: ['view_dashboard', 'manage_news', 'manage_gallery', 'manage_messages', 'messages.reply'],
    viewer: ['view_dashboard', 'members.view'],
  }

  for (const [roleName, keys] of Object.entries(rolePerms)) {
    const role = createdRoles[roleName]
    if (!role) continue
    for (const key of keys) {
      const perm = createdPerms[key]
      if (!perm) continue
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      })
    }
  }

  await prisma.user.update({
    where: { email },
    data: { roleId: createdRoles.super_admin.id },
  })

  await prisma.producteur.createMany({
    data: [
      { nom: 'Producteur A', description: 'Description A' },
      { nom: 'Producteur B', description: 'Description B' },
    ],
    skipDuplicates: true,
  })

  const formation = await prisma.formation.upsert({
    where: { id: 'seed-formation-pdima-1' },
    update: {},
    create: {
      id: 'seed-formation-pdima-1',
      title: 'Formation agriculture durable PDIMA',
      session: 'Session 2026',
      date: new Date('2026-08-01'),
      participants: 30,
      attendees: 28,
      evaluation: 4.5,
      certificate: true,
      status: 'done',
    },
  })

  await prisma.beneficiary.createMany({
    data: [
      { firstName: 'Jean', lastName: 'Rakoto', name: 'Rakoto Jean', category: 'Formation', formationId: formation.id, contact: '+261340000001', sex: 'M', status: 'active' },
      { firstName: 'Fara', lastName: 'Rasoamanana', name: 'Rasoamanana Fara', category: 'Distribution', contact: '+261340000002', sex: 'F', status: 'active' },
      { firstName: 'Mamy', lastName: 'Randrianasolo', name: 'Randrianasolo Mamy', category: 'Emploi', contact: '+261340000003', sex: 'M', status: 'active' },
      { firstName: 'Tina', lastName: 'Vololona', name: 'Vololona Tina', category: 'Autre', contact: '+261340000004', sex: 'F', status: 'active' },
    ],
    skipDuplicates: true,
  })

  console.log('Seed complete — super user:', email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
