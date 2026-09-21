// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')



  // Create a default user
  const user = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      timezone: 'UTC',
      settings: {
        create: {
          workStart: '09:00',
          workEnd: '17:00',
          dailyGoalHours: 8,
          theme: 'dark',
          accentColor: 'blue',
        }
      }
    }
  })

  // Create default categories
  const categories = [
    { name: 'Development', color: 'blue', icon: 'code' },
    { name: 'Meeting', color: 'purple', icon: 'users' },
    { name: 'Support', color: 'green', icon: 'life-buoy' },
    { name: 'Documentation', color: 'orange', icon: 'file-text' },
    { name: 'Research', color: 'cyan', icon: 'search' },
    { name: 'Administration', color: 'slate', icon: 'settings' },
    { name: 'Break', color: 'zinc', icon: 'coffee' }
  ]

  for (const cat of categories) {
    await prisma.category.create({
      data: {
        userId: user.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon
      }
    })
  }

  console.log('Database seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
