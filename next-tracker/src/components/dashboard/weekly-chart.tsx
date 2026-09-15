"use client"

import React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type WeeklyChartProps = {
  data: any[]
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  // Extract unique categories from data
  const categories = Array.from(
    new Set(
      data.flatMap(d => Object.keys(d).filter(k => k !== 'date' && k !== 'total'))
    )
  )
  
  // A sleek predefined palette for the stacked bars
  const colors = [
    "hsl(var(--primary))",
    "#8b5cf6", // Purple
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#0ea5e9", // Sky
    "#64748b", // Slate
  ]

  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            dx={-10}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.9)', 
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            itemStyle={{ color: '#fff' }}
          />
          
          {categories.map((cat, i) => (
            <Bar 
              key={cat} 
              dataKey={cat} 
              stackId="a" 
              fill={colors[i % colors.length]} 
              radius={i === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
