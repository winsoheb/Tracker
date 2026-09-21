const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMMY_EMAIL = "dummy.member@test.com";

async function clearDummyData() {
  console.log("Clearing dummy data...");
  const dummyUser = await prisma.user.findUnique({ where: { email: DUMMY_EMAIL } });
  
  if (dummyUser) {
    // Since we have Cascade deletes on user relations, deleting the user will 
    // delete their timers, tasks, etc.
    await prisma.user.delete({ where: { id: dummyUser.id } });
    console.log("Dummy user and all associated dummy data removed successfully.");
  } else {
    console.log("No dummy data found.");
  }
}

async function seedDummyData() {
  console.log("Seeding dummy data...");
  
  // First ensure clean state
  await clearDummyData();
  
  // Create Dummy User
  const user = await prisma.user.create({
    data: {
      name: "[DUMMY] John Doe",
      email: DUMMY_EMAIL,
      role: "EMPLOYEE",
      isActive: true,
      timezone: "UTC"
    }
  });

  const today = new Date();
  today.setHours(12, 0, 0, 0); // Noon today

  // 1. Add some planned tasks (some completed, some not)
  await prisma.task.create({
    data: {
      userId: user.id,
      title: "[DUMMY] Design Database Schema",
      status: "COMPLETED",
      priority: "HIGH",
      startAt: today,
      estimatedMinutes: 120, // 2 hours
    }
  });

  await prisma.task.create({
    data: {
      userId: user.id,
      title: "[DUMMY] Write API Endpoints",
      status: "TODO",
      priority: "MEDIUM",
      startAt: today,
      estimatedMinutes: 180, // 3 hours
    }
  });

  // 2. Add an active running timer
  await prisma.runningTimer.create({
    data: {
      userId: user.id,
      title: "[DUMMY] Working on API documentation",
      startedAt: new Date(Date.now() - 45 * 60 * 1000), // Started 45 mins ago
      accumulatedDuration: 0
    }
  });

  console.log("Dummy data seeded successfully! You can now view the Manager Dashboard.");
  console.log("To remove this data later, run: node scripts/seed-manager-dummy.js --clear");
}

async function main() {
  if (process.argv.includes("--clear")) {
    await clearDummyData();
  } else {
    await seedDummyData();
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
