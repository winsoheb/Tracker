"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function getUserTimeOffs(userId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  
  return await db.timeOff.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      }
    },
    orderBy: { date: "asc" }
  })
}

export async function addTimeOff(data: { userId: string, date: Date, type: string, reason?: string }) {
  try {
    const existing = await db.timeOff.findFirst({
      where: {
        userId: data.userId,
        date: data.date
      }
    })

    if (existing) {
      await db.timeOff.update({
        where: { id: existing.id },
        data: {
          type: data.type,
          reason: data.reason,
        }
      })
    } else {
      await db.timeOff.create({
        data: {
          userId: data.userId,
          date: data.date,
          type: data.type,
          reason: data.reason,
          status: "APPROVED"
        }
      })
    }

    revalidatePath("/profile")
    revalidatePath("/reports/team")
    return { success: true }
  } catch (error) {
    console.error("Error adding time off:", error)
    return { success: false, error: "Failed to save time off." }
  }
}

export async function deleteTimeOff(id: string) {
  try {
    await db.timeOff.delete({ where: { id } })
    revalidatePath("/profile")
    revalidatePath("/reports/team")
    return { success: true }
  } catch (error) {
    console.error("Error deleting time off:", error)
    return { success: false, error: "Failed to delete time off." }
  }
}
