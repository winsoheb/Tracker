"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { CheckCircle2 } from "lucide-react"

type AggregationData = {
  userId: string
  plannedMinutes: number
  completedMinutes: number
  activeTaskCount: number
}

export function PlannedVsActualChart({ aggregation }: { aggregation: AggregationData[] }) {
  // Map data to display format
  const data = aggregation.map((agg, idx) => ({
    name: `Member ${idx + 1}`, // We don't have the user's name in this specific payload, so we use an index, or we could fetch it.
    Planned: +(agg.plannedMinutes / 60).toFixed(1),
    Completed: +(agg.completedMinutes / 60).toFixed(1),
  }))

  return (
    <div className="bg-background/40 backdrop-blur-3xl border border-white/5 p-6 rounded-3xl h-full shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium flex items-center gap-2 text-foreground/80">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Planned vs Completed (Hours)
        </h2>
      </div>
      
      <div className="h-[300px] w-full mt-4">
        {data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground/50 text-sm font-medium">
            No planned tasks for today
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(100,116,139,0.2)' }}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar 
                dataKey="Planned" 
                fill="#94a3b8" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              />
              <Bar 
                dataKey="Completed" 
                fill="var(--primary)" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
