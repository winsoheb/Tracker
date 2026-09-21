const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FROM_USER = '3383faa3-a58a-4d68-a506-11409c717419';
const TO_USER = 'f1e09330-4699-4d6c-b34a-bc16fcfcda4c';

async function migrate() {
  console.log(`Migrating data from ${FROM_USER} to ${TO_USER}...`);
  
  const tables = [
    'category', 'project', 'timeEntry', 'runningTimer', 
    'break', 'shift', 'task', 'activityEvent', 'auditLog'
  ];

  for (const table of tables) {
    const res = await prisma[table].updateMany({
      where: { userId: FROM_USER },
      data: { userId: TO_USER }
    });
    console.log(`Migrated ${res.count} rows in ${table}`);
  }

  // Handle setting safely
  try {
    const existing = await prisma.setting.findUnique({ where: { userId: TO_USER } });
    if (!existing) {
      await prisma.setting.update({
        where: { userId: FROM_USER },
        data: { userId: TO_USER }
      });
      console.log('Migrated setting');
    }
  } catch(e) {
    console.log('Skipped setting');
  }

  console.log("Migration complete.");
}

migrate()
  .catch(console.error)
  .finally(() => process.exit(0));
