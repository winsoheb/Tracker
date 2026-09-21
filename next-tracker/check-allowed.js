const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const managerId = '73dc6aec-3f6e-4e4d-93fe-515b8157af17'; // manger ID
  
  const managedTeams = await prisma.teamMember.findMany({
    where: { userId: managerId, isManager: true },
    select: { teamId: true }
  })
  const teamIds = managedTeams.map(t => t.teamId)
  const members = await prisma.teamMember.findMany({
    where: { teamId: { in: teamIds } },
    select: { userId: true }
  })
  const allowed = Array.from(new Set(members.map(m => m.userId)))
  
  console.log("Allowed IDs for manager:", allowed)
  console.log("Does it include Soheb?", allowed.includes('f1e09330-4699-4d6c-b34a-bc16fcfcda4c'))
}

main().catch(console.error).finally(() => prisma.$disconnect())
