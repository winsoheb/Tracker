"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/actions/activity"
import { requireAuth } from "@/lib/auth-utils"

async function getUserId() {
  const user = await requireAuth()
  return user.id
}

// --- CATEGORIES ---

export async function getCategories() {
  const userId = await getUserId() // Kept for reference or other uses
  return await prisma.category.findMany({
    orderBy: { createdAt: "desc" }
  })
}

export async function createCategory(data: { name: string, color?: string, icon?: string }) {
  const userId = await getUserId()
  const category = await prisma.category.create({
    data: {
      userId,
      name: data.name,
      color: data.color || "#3b82f6",
      icon: data.icon
    }
  })
  await logActivity("Create", "Category", category.id, `Created category: ${category.name}`)
  revalidatePath("/settings")
  return category
}

export async function deleteCategory(id: string) {
  // Let any authenticated user delete a category, or we could restrict it.
  // For now, anyone can manage global categories.
  const category = await prisma.category.findUnique({ where: { id } })
  if (category) {
    await prisma.category.delete({ where: { id } })
    await logActivity("Delete", "Category", id, `Deleted category: ${category.name}`)
  }
  revalidatePath("/settings")
}

// --- PROJECTS ---

export async function getProjects() {
  const userId = await getUserId()
  return await prisma.project.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" }
  })
}

export async function createProject(data: { name: string, categoryId?: string, description?: string }) {
  const userId = await getUserId()
  const project = await prisma.project.create({
    data: {
      userId,
      name: data.name,
      categoryId: data.categoryId || null,
      description: data.description,
      status: "ACTIVE"
    }
  })
  await logActivity("Create", "Project", project.id, `Created project: ${project.name}`)
  revalidatePath("/settings")
  return project
}

export async function deleteProject(id: string) {
  const project = await prisma.project.findUnique({ where: { id } })
  if (project) {
    await prisma.project.delete({ where: { id } })
    await logActivity("Delete", "Project", id, `Deleted project: ${project.name}`)
  }
  revalidatePath("/settings")
}

// --- SETTINGS ---

export async function getSettings() {
  const userId = await getUserId()
  return await prisma.setting.findUnique({
    where: { userId }
  })
}

export async function updateSettings(data: { dailyGoalHours: number, notifications: boolean }) {
  const userId = await getUserId()
  const settings = await prisma.setting.upsert({
    where: { userId },
    update: {
      dailyGoalHours: data.dailyGoalHours,
      notifications: data.notifications
    },
    create: {
      userId,
      dailyGoalHours: data.dailyGoalHours,
      notifications: data.notifications
    }
  })
  
  await logActivity("Update", "Setting", settings.id, "Updated application settings")
  revalidatePath("/settings")
  revalidatePath("/")
  return settings
}
