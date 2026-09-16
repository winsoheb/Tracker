import { TimerContainer } from "@/components/timer/timer-container"
import { getDashboardData } from "@/lib/actions/dashboard"
import { WeeklyChart } from "@/components/dashboard/weekly-chart"
import { DailyGoal } from "@/components/dashboard/daily-goal"
import { RecentActivity } from "@/components/dashboard/recent-activity"

// Opt out of caching since this is a real-time dashboard
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8">
      
      <header className="mb-4 flex flex-col items-center text-center">
        <h1 className="text-3xl font-light tracking-tight mb-2">
          Good morning, <span className="font-semibold text-primary neon-text">Admin</span>.
        </h1>
        <p className="text-muted-foreground tracking-wide">
          Ready to focus? Let's track some deep work.
        </p>
      </header>

      <section className="relative w-full z-20 min-h-[120px] flex flex-col items-center justify-center">
        <TimerContainer categories={data.categories} />
      </section>

      {/* Dashboard widgets */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {/* Weekly Chart */}
        <div className="glass p-6 rounded-2xl md:col-span-2 min-h-[350px] flex flex-col shadow-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Last 7 Days</h3>
          <div className="flex-1">
            <WeeklyChart data={data.chartData} />
          </div>
        </div>
        
        {/* Daily Goal */}
        <div className="glass p-6 rounded-2xl min-h-[350px] flex flex-col shadow-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Today's Goal</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <DailyGoal 
              todaysTotalSeconds={data.todaysTotalSeconds} 
              dailyGoalSeconds={data.dailyGoalSeconds} 
            />
          </div>
        </div>
      </section>

      {/* Two-column layout for Activity and Categories */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Recent Activity */}
        <div className="glass p-6 rounded-2xl min-h-[300px] flex flex-col shadow-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Today's Activity</h3>
          <div className="flex-1">
            <RecentActivity entries={data.todaysEntries} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass p-6 rounded-2xl min-h-[300px] flex flex-col shadow-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Category Breakdown</h3>
          <div className="flex-1 space-y-4">
            {data.categorySummary.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground/50 border border-dashed border-white/5 rounded-xl">
                No data yet.
              </div>
            ) : (
              data.categorySummary.map((cat) => (
                <div key={cat.name} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
                    <span className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: cat.color, boxShadow: `0 0 10px ${cat.color}` }} />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-medium text-foreground">{cat.name}</span>
                    <span className="font-mono text-muted-foreground">
                      {(cat.duration / 3600).toFixed(1)}h
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
