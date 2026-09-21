const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const tasks = await prisma.task.findMany({
    where: { userId: 'f1e09330-4699-4d6c-b34a-bc16fcfcda4c' }
  })
  console.log("\nTasks for Soheb:")
  console.log(tasks)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
