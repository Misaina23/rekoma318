import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  const email1 = 'andrianisaina23@gmail.com'
  const plain1 = '2311saina!'
  const hashed1 = await bcrypt.hash(plain1, 12)

  await prisma.user.upsert({
    where: { email: email1 },
    update: { emailVerified: true },
    create: {
      email: email1,
      password: hashed1,
      role: 'super_admin',
      name: 'Super Admin',
      emailVerified: true,
    },
  })

  const email2 = 'botomznanga@gmail.com'
  const plain2 = 'elju2026!'
  const hashed2 = await bcrypt.hash(plain2, 12)

  await prisma.user.upsert({
    where: { email: email2 },
    update: { emailVerified: true },
    create: {
      email: email2,
      password: hashed2,
      role: 'super_admin',
      name: 'Super Admin 2',
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
    { key: 'manage_products', label: 'Gérer les articles', category: 'store' },
    { key: 'manage_orders', label: 'Gérer les commandes', category: 'store' },
    { key: 'manage_news', label: 'Gérer les actualités', category: 'news' },
    { key: 'manage_gallery', label: 'Gérer la galerie', category: 'gallery' },
    { key: 'manage_documents', label: 'Gérer les documents', category: 'documents' },
    { key: 'manage_messages', label: 'Gérer les messages', category: 'messages' },
    { key: 'messages.reply', label: 'Répondre aux messages', category: 'messages' },
    { key: 'manage_beneficiaries', label: 'Gérer les bénéficiaires', category: 'beneficiaries' },
    { key: 'manage_personnel', label: 'Gérer le personnel et contrats', category: 'personnel' },
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
      'manage_products',
      'manage_orders',
      'manage_news',
      'manage_gallery',
      'manage_documents',
      'manage_messages',
      'messages.reply',
      'manage_beneficiaries',
      'manage_personnel',
      'view_analytics',
    ],
    formation_lead: ['view_dashboard', 'manage_formations', 'view_analytics'],
    finance_lead: ['view_dashboard', 'manage_donations', 'manage_orders', 'view_analytics', 'manage_settings'],
    editor: ['view_dashboard', 'manage_news', 'manage_gallery', 'manage_documents', 'manage_products'],
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

  await prisma.user.updateMany({
    where: { email: { in: [email1, email2] } },
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
      capacity: 30,
      participants: 2,
      attendees: 2,
      evaluation: 4.5,
      certificate: true,
      status: 'done',
    },
  })

  const ben1 = await prisma.beneficiary.upsert({
    where: { cin: '201011000001' },
    update: {},
    create: {
      firstName: 'Jean',
      lastName: 'Rakoto',
      cin: '201011000001',
      name: 'Rakoto Jean',
      category: 'Agriculture & SRI',
      commune: 'Ambatolampy',
      fokontany: 'Antsampandrano',
      householdSize: 5,
      phone: '+261340000001',
      contact: '+261340000001',
      sex: 'M',
      status: 'active',
    },
  })

  const ben2 = await prisma.beneficiary.upsert({
    where: { cin: '201012000002' },
    update: {},
    create: {
      firstName: 'Fara',
      lastName: 'Rasoamanana',
      cin: '201012000002',
      name: 'Rasoamanana Fara',
      category: 'Maraîchage',
      commune: 'Antsirabe',
      fokontany: 'Manandona',
      householdSize: 4,
      phone: '+261340000002',
      contact: '+261340000002',
      sex: 'F',
      status: 'active',
    },
  })

  await prisma.formationEnrollment.upsert({
    where: { formationId_beneficiaryId: { formationId: formation.id, beneficiaryId: ben1.id } },
    update: {},
    create: {
      formationId: formation.id,
      beneficiaryId: ben1.id,
      attendanceStatus: 'present',
      evaluationScore: 4.5,
      certificateIssued: true,
    },
  })

  await prisma.formationEnrollment.upsert({
    where: { formationId_beneficiaryId: { formationId: formation.id, beneficiaryId: ben2.id } },
    update: {},
    create: {
      formationId: formation.id,
      beneficiaryId: ben2.id,
      attendanceStatus: 'present',
      evaluationScore: 4.8,
      certificateIssued: true,
    },
  })

  const staff1 = await prisma.staff.upsert({
    where: { matricule: 'REK-RH-001' },
    update: {},
    create: {
      matricule: 'REK-RH-001',
      firstName: 'Mamy',
      lastName: 'Randrianasolo',
      cin: '101231000003',
      sex: 'M',
      phone: '+261340000003',
      email: 'mamy.randria@rekoma.org',
      position: 'Technicien Agricole Principal',
      department: 'Vulgarisation Agricole',
      status: 'active',
      evaluationScore: 4.6,
      professionalNotes: 'Encadrement terrain des coopératives rizicoles.',
    },
  })

  const existingContracts = await prisma.employmentContract.count({ where: { staffId: staff1.id } })
  if (existingContracts === 0) {
    await prisma.employmentContract.create({
      data: {
        staffId: staff1.id,
        contractType: 'CDI',
        startDate: new Date('2025-01-15'),
        salary: 1200000,
        assignmentLocation: 'Antenne Vakinankaratra',
        status: 'active',
      },
    })
  }

  console.log('Seed complete — super users:', email1, 'and', email2)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
