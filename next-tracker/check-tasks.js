const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const tasks = await prisma.task.findMany({
    include: { user: true }
  })
  console.log("Tasks:");
  tasks.forEach(t => console.log(`Task: ${t.title} | User: ${t.user.name} (${t.userId}) | Status: ${t.status}`))
}
main().catch(console.error).finally(() => prisma.$disconnect())
