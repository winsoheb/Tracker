"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const COLORS = ["#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#22c55e", "#94a3b8"]

export function ChartsView({ tasks }: { tasks: any[] }) {
  // Aggregate tasks by status
  const statusCounts = tasks.reduce((acc, task) => {
    let s = task.status
    if (s === "TODO") s = "UP_NEXT"
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace("_", " "),
    value
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold mb-6">Status Overview</h3>
        {tasks.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No tasks to display
          </div>
        )}
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold mb-6">Task Summary</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-muted-foreground">Total Tasks</span>
            <span className="text-xl font-bold">{tasks.length}</span>
          </div>
          {chartData.map((data, index) => (
            <div key={data.name} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4" style={{ borderColor: COLORS[index % COLORS.length] }}>
              <span className="capitalize">{String(data.name).toLowerCase()}</span>
              <span className="font-semibold">{String(data.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
