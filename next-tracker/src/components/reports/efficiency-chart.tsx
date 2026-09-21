"use client"

import React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts"
import { Target } from "lucide-react"

type EfficiencyData = {
  date: string
  hoursWorked: number
  dailyGoal: number
}

export function EfficiencyChart({ data }: { data: EfficiencyData[] }) {
  // We can just use the first item's goal for the reference line if it exists
  const goal = data.length > 0 ? data[0].dailyGoal : 8

  return (
    <div className="bg-background/40 backdrop-blur-3xl border border-white/5 p-6 rounded-3xl h-full shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium flex items-center gap-2 text-foreground/80">
          <Target className="w-5 h-5 text-primary" />
          Weekly Efficiency (Hours vs Goal)
        </h2>
      </div>
      
      <div className="h-[300px] w-full mt-4">
        {data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground/50 text-sm font-medium">
            No data available for this week.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="date" 
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
              <ReferenceLine y={goal} label="Daily Goal" stroke="rgba(147,51,234,0.5)" strokeDasharray="3 3" />
              <Bar 
                dataKey="hoursWorked" 
                name="Hours Worked"
                fill="var(--primary)" 
                radius={[4, 4, 0, 0]} 
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
