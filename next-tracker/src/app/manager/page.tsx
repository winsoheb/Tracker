import { getTeamWorkload } from "@/lib/actions/manager"
import dynamic from "next/dynamic"

const TeamWorkloadWidget = dynamic(() => import("@/components/dashboard/team-workload-widget").then(mod => mod.TeamWorkloadWidget), { loading: () => <div className="h-[300px] w-full bg-white/5 animate-pulse rounded-3xl" /> })
const PlannedVsActualChart = dynamic(() => import("@/components/dashboard/planned-vs-actual-chart").then(mod => mod.PlannedVsActualChart), { loading: () => <div className="h-[300px] w-full bg-white/5 animate-pulse rounded-3xl" /> })

export const metadata = {
  title: "Manager Dashboard | WorkOrbit",
}

export default async function ManagerDashboardPage() {
  const data = await getTeamWorkload()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
            Manager Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Operational visibility for your teams. No surveillance metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TeamWorkloadWidget activeTimers={data.activeTimers} />
        </div>
        <div className="lg:col-span-2">
          <PlannedVsActualChart aggregation={data.workloadAggregation} />
        </div>
      </div>
    </div>
  )
}
