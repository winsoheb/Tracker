const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const manager = await prisma.user.findUnique({
    where: { email: 'manager@example.com' }
  })
  console.log("Manager role:", manager.role)
}

main().catch(console.error).finally(() => prisma.$disconnect())
