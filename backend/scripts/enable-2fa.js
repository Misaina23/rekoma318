import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.update({
    where: { email: 'andrianisaina23@gmail.com' },
    data: { twoFactorEnabled: true },
    select: { id: true, email: true, twoFactorEnabled: true, role: true },
  })
  console.log('Utilisateur mis à jour:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
