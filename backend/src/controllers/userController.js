import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma.js'
import { roleCapabilities, resolvePermissions, ROLE_LABELS } from '../lib/permissions.js'
import { sendEmail, passwordResetEmail } from '../utils/mail.js'

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    roleLabel: ROLE_LABELS[u.role] || u.role,
    permissions: resolvePermissions(u),
    active: u.active,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    memberId: u.memberId || null,
  }
}

export async function listUsers(req, res) {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
  res.json(users.map(publicUser))
}

export async function listMembersForUser(req, res) {
  const members = await prisma.member.findMany({
    where: { status: 'active' },
    orderBy: { displayOrder: 'asc' },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, designation: true },
  })
  res.json(members)
}

// Create a dashboard user from an existing member (no profile duplication).
export async function createUser(req, res) {
  const { memberId, email, password, role } = req.body || {}
  if (!memberId) return res.status(400).json({ success: false, error: 'memberId requis' })
  const member = await prisma.member.findUnique({ where: { id: memberId } })
  if (!member) return res.status(404).json({ success: false, error: 'Membre introuvable' })

  const userEmail = email || member.email
  if (!userEmail) return res.status(400).json({ success: false, error: 'Email requis (membre sans email)' })

  const existing = await prisma.user.findUnique({ where: { email: userEmail } })
  if (existing) return res.status(409).json({ success: false, error: 'Un utilisateur existe déjà pour cet email' })

  const plain = password || crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
  const hashed = await bcrypt.hash(plain, 12)
  const user = await prisma.user.create({
    data: {
      email: userEmail,
      password: hashed,
      name: `${member.firstName} ${member.lastName}`,
      role: role || 'viewer',
      active: true,
      memberId,
    },
  })

  // send credentials email
  await sendEmail({
    to: userEmail,
    subject: 'Vos accès au tableau de bord REKOMA',
    html: `<p>Bonjour ${member.firstName},</p><p>Un compte a été créé pour vous :</p><p>Email : <strong>${userEmail}</strong><br/>Mot de passe temporaire : <strong>${plain}</strong></p><p>Connectez-vous et changez votre mot de passe.</p>`,
    text: `Email: ${userEmail}\nMot de passe temporaire: ${plain}`,
  }).catch(() => {})

  res.status(201).json({ success: true, user: publicUser(user), temporaryPassword: plain })
}

export async function updateUser(req, res) {
  const { id } = req.params
  const { role, permissions, active } = req.body || {}
  const data = {}
  if (role) data.role = role
  if (permissions !== undefined) data.permissions = permissions // array or {add,remove}
  if (active !== undefined) data.active = Boolean(active)
  const user = await prisma.user.update({ where: { id }, data })
  res.json({ success: true, user: publicUser(user) })
}

export async function resetPassword(req, res) {
  const { id } = req.params
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return res.status(404).json({ success: false, error: 'Introuvable' })
  const plain = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
  const hashed = await bcrypt.hash(plain, 12)
  await prisma.user.update({ where: { id }, data: { password: hashed } })
  const link = `${process.env.FRONTEND_URL || 'https://rekoma-318.vercel.app'}/admin/login`
  await passwordResetEmail(user.email, link)
  res.json({ success: true, temporaryPassword: plain })
}

export async function deleteUser(req, res) {
  const { id } = req.params
  await prisma.user.delete({ where: { id } })
  res.json({ success: true })
}

export { roleCapabilities }
