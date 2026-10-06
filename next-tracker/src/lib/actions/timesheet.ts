"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function importTimesheetData(rows: any[]) {
  const currentUser = await requireAuth()
  if (currentUser.role !== "MANAGER" && currentUser.role !== "ADMIN") {
    throw new Error("Only managers or admins can import timesheets")
  }

  const results = {
    success: 0,
    skipped: 0,
    errors: [] as string[]
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      // Expecting: Date, Employee Name, Role, Task Category, Task Description, Start Time, End Time, Hours Spent, Status, Remarks
      const dateStr = row["Date"]
      const empName = row["Employee Name"]
      const categoryName = row["Task Category"]
      const taskDesc = row["Task Description"]
      const startTimeStr = row["Start Time"]
      const endTimeStr = row["End Time"]
      const statusStr = row["Status"] || "COMPLETED"
      const remarks = row["Remarks"]

      if (!empName || !dateStr || !taskDesc) {
        results.skipped++
        continue
      }

      // Find user
      const user = await prisma.user.findFirst({
        where: { name: { equals: empName, mode: 'insensitive' } }
      })

      if (!user) {
        results.errors.push(`Row ${i + 2}: User "${empName}" not found`)
        results.skipped++
        continue
      }

      // Find or create category
      let category = null
      if (categoryName) {
        category = await prisma.category.findFirst({
          where: { name: { equals: categoryName, mode: 'insensitive' }, userId: user.id }
        })
        if (!category) {
          category = await prisma.category.create({
            data: {
              name: categoryName,
              userId: user.id
            }
          })
        }
      }

      // Parse dates
      // Simple parsing assuming date is in MM/DD/YYYY or similar Excel format (client might parse it to ISO string)
      let start = new Date(dateStr)
      let end = new Date(dateStr)
      
      if (startTimeStr && endTimeStr) {
         // Custom logic to handle time merging can go here if the strings are HH:mm
         // For now, if client sends ISO strings for start/end, we use them.
         // Let's assume the client passes proper ISO strings if they are parsed well, or we just trust the Date parsing.
         const startParts = startTimeStr.split(":")
         if (startParts.length >= 2) {
           start.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0)
         }
         const endParts = endTimeStr.split(":")
         if (endParts.length >= 2) {
           end.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0)
         }
      }

      let duration = Math.round((end.getTime() - start.getTime()) / 1000)
      if (duration <= 0) {
        duration = 3600 // Default 1 hour if invalid
      }

      // Create Task
      const task = await prisma.task.create({
        data: {
          userId: user.id,
          categoryId: category?.id,
          title: taskDesc,
          description: remarks,
          status: statusStr.toUpperCase().replace(" ", "_"),
          startAt: start,
          endAt: end,
        }
      })

      // Create TimeEntry
      await prisma.timeEntry.create({
        data: {
          userId: user.id,
          categoryId: category?.id,
          taskId: task.id,
          title: taskDesc,
          description: remarks,
          startedAt: start,
          endedAt: end,
          duration,
          source: "MANUAL"
        }
      })

      results.success++
    } catch (e: any) {
      results.errors.push(`Row ${i + 2}: ${e.message}`)
      results.skipped++
    }
  }

  return results
}
