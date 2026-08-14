import { prisma } from '../lib/prisma.js'
import { hasPermission, clearPermissionCache } from '../lib/permissions.js'

function cleanUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    roleId: u.roleId,
    active: u.active,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    memberId: u.memberId || null,
    permissions: u.permissions || null,
  }
}

export async function listRoles(req, res) {
  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } },
    orderBy: { name: 'asc' },
  })
  res.json(roles.map(r => ({
    ...r,
    permissionKeys: r.permissions.map(rp => rp.permission.key),
  })))
}

export async function createRole(req, res) {
  const { name, label, description, permissionKeys } = req.body || {}
  if (!name || !label) return res.status(400).json({ success: false, error: 'Nom et label requis' })

  const role = await prisma.role.create({
    data: {
      name,
      label,
      description: description || null,
      isSystem: false,
      permissions: {
        create: (permissionKeys || []).map(key => ({ permission: { connect: { key } } })),
      },
    },
    include: { permissions: { include: { permission: true } } },
  })

  await clearPermissionCache()
  res.status(201).json({ success: true, role: { ...role, permissionKeys: role.permissions.map(rp => rp.permission.key) } })
}

export async function updateRole(req, res) {
  const { id } = req.params
  const { name, label, description, permissionKeys } = req.body || {}

  const data = {
    ...(name ? { name } : {}),
    ...(label ? { label } : {}),
    ...(description !== undefined ? { description: description || null } : {}),
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      ...data,
      ...(permissionKeys ? {
        permissions: {
          deleteMany: {},
          create: permissionKeys.map(key => ({ permission: { connect: { key } } })),
        },
      } : {}),
    },
    include: { permissions: { include: { permission: true } } },
  })

  await clearPermissionCache()
  res.json({ success: true, role: { ...role, permissionKeys: role.permissions.map(rp => rp.permission.key) } })
}

export async function deleteRole(req, res) {
  const { id } = req.params
  const role = await prisma.role.findUnique({ where: { id } })
  if (role?.isSystem) return res.status(400).json({ success: false, error: 'Impossible de supprimer un rôle système' })

  await prisma.role.delete({ where: { id } })
  await clearPermissionCache()
  res.json({ success: true })
}

export async function listPermissions(req, res) {
  const perms = await prisma.permission.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] })
  res.json(perms)
}

export async function listUserPermissions(req, res) {
  const { userId } = req.params
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roleRef: { include: { permissions: { include: { permission: true } } } },
      userPermissions: { include: { permission: true } },
    },
  })
  if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' })

  const rolePerms = user.roleRef?.permissions.map(rp => rp.permission.key) || []
  const addPerms = user.userPermissions.filter(up => up.mode === 'add').map(up => up.permission.key)
  const removePerms = user.userPermissions.filter(up => up.mode === 'remove').map(up => up.permission.key)

  res.json({
    userId: user.id,
    role: user.role,
    roleId: user.roleId,
    rolePermissions: rolePerms,
    userPermissions: user.permissions || { add: [], remove: [] },
    overrides: { add: addPerms, remove: removePerms },
  })
}

export async function updateUserPermissions(req, res) {
  const { userId } = req.params
  const { roleId, permissions } = req.body || {}

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' })

  const data = {}
  if (roleId) data.roleId = roleId
  if (permissions !== undefined) data.permissions = permissions

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    include: {
      roleRef: { include: { permissions: { include: { permission: true } } } },
      userPermissions: { include: { permission: true } },
    },
  })

  await clearPermissionCache()
  res.json({ success: true, user: cleanUser(updated) })
}

export { cleanUser }
