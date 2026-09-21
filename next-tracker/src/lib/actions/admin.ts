"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"

// Remove the import { Role } from "@prisma/client" because it doesn't exist anymore

export async function getAllUsers() {
  await requireAdmin()
  return await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      department: true
    }
  })
}

export async function getUserById(id: string) {
  await requireAdmin()
  return await prisma.user.findUnique({
    where: { id },
    include: {
      department: true,
      teamMemberships: {
        include: {
          team: true
        }
      }
    }
  })
}

export async function updateUserRole(userId: string, newRole: string) {
  await requireAdmin()
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  })
  revalidatePath("/admin")
}

import bcrypt from "bcryptjs"

export async function createUserManual(data: { name: string, email: string, role?: string, password?: string }) {
  await requireAdmin()
  
  const existing = await prisma.user.findUnique({
    where: { email: data.email }
  })
  if (existing) {
    throw new Error("User with this email already exists")
  }

  const passwordHash = await bcrypt.hash(data.password || "password123", 10)

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role || "EMPLOYEE",
      passwordHash
    }
  })

  revalidatePath("/admin")
  return newUser
}
