const sqlite3 = require('sqlite3').verbose();
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting SQLite to PostgreSQL migration...');

  // Connect to the old SQLite database
  const sqliteDbPath = path.resolve(__dirname, '../prisma/dev.db');
  const db = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Could not connect to SQLite database:', err.message);
      process.exit(1);
    }
  });

  // Helper function to run SQLite queries
  const fetchAll = (query) => {
    return new Promise((resolve, reject) => {
      db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  try {
    // 1. Migrate Users
    console.log('Migrating Users...');
    const users = await fetchAll('SELECT * FROM "User"');
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          timezone: user.timezone,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
          role: 'ADMIN', // Default the first migrated user to Admin
        },
      });
    }

    // 2. Migrate Categories
    console.log('Migrating Categories...');
    const categories = await fetchAll('SELECT * FROM "Category"');
    for (const cat of categories) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: {},
        create: {
          id: cat.id,
          userId: cat.userId,
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
          hourlyGoal: cat.hourlyGoal,
          isActive: cat.isActive === 1,
          createdAt: new Date(cat.createdAt),
          updatedAt: new Date(cat.updatedAt),
        },
      });
    }

    // 3. Migrate Projects
    console.log('Migrating Projects...');
    const projects = await fetchAll('SELECT * FROM "Project"');
    for (const proj of projects) {
      await prisma.project.upsert({
        where: { id: proj.id },
        update: {},
        create: {
          id: proj.id,
          userId: proj.userId,
          name: proj.name,
          description: proj.description,
          categoryId: proj.categoryId,
          color: proj.color,
          status: proj.status,
          startDate: proj.startDate ? new Date(proj.startDate) : null,
          dueDate: proj.dueDate ? new Date(proj.dueDate) : null,
          createdAt: new Date(proj.createdAt),
          updatedAt: new Date(proj.updatedAt),
        },
      });
    }

    // 4. Migrate TimeEntries
    console.log('Migrating TimeEntries...');
    const entries = await fetchAll('SELECT * FROM "TimeEntry"');
    for (const entry of entries) {
      await prisma.timeEntry.upsert({
        where: { id: entry.id },
        update: {},
        create: {
          id: entry.id,
          userId: entry.userId,
          projectId: entry.projectId,
          categoryId: entry.categoryId,
          title: entry.title,
          description: entry.description,
          startedAt: new Date(entry.startedAt),
          endedAt: new Date(entry.endedAt),
          duration: entry.duration,
          source: entry.source,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        },
      });
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    db.close();
    await prisma.$disconnect();
  }
}

main();
