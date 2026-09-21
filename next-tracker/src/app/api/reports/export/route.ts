import { NextRequest, NextResponse } from "next/server"
import { requireManager } from "@/lib/auth-utils"
import { getTeamWorkloadSummary } from "@/lib/reports/engine"

export async function GET(req: NextRequest) {
  try {
    const currentUser = await requireManager()
    
    const { searchParams } = new URL(req.url)
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")
    
    if (!startDateStr || !endDateStr) {
      return new NextResponse("Missing date range", { status: 400 })
    }

    const filter = {
      startDate: new Date(startDateStr),
      endDate: new Date(endDateStr)
    }

    const teamWorkload = await getTeamWorkloadSummary(currentUser, filter)

    // Construct CSV
    const rows = [
      ["Employee Name", "Email", "Open Tasks", "Planned Minutes", "Planned Hours", "Capacity Minutes", "Capacity Hours", "Overallocation %"]
    ]

    for (const member of teamWorkload) {
      const plannedHrs = (member.plannedMinutes / 60).toFixed(2)
      const capacityHrs = (member.availableCapacityMinutes / 60).toFixed(2)
      const capacityPercent = member.availableCapacityMinutes > 0 
        ? Math.round((member.plannedMinutes / member.availableCapacityMinutes) * 100) 
        : 0

      rows.push([
        `"${member.name}"`,
        `"${member.email}"`,
        member.openTasks.toString(),
        member.plannedMinutes.toString(),
        plannedHrs,
        member.availableCapacityMinutes.toString(),
        capacityHrs,
        `${capacityPercent}%`
      ])
    }

    const csvContent = rows.map(r => r.join(",")).join("\n")

    const headers = new Headers({
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="team-workload-${startDateStr.split("T")[0]}.csv"`
    })

    return new NextResponse(csvContent, { status: 200, headers })
  } catch (error: any) {
    console.error("Export error:", error)
    return new NextResponse("Unauthorized or Server Error", { status: 500 })
  }
}
