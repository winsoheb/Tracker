"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { format, startOfWeek, isSameWeek } from "date-fns"

const COLORS = ["#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#22c55e", "#94a3b8"]

export function TeamReportView({ data, month, year }: any) {
  const router = useRouter()
  const [m, setM] = useState(month)
  const [y, setY] = useState(year)

  const handleFilter = () => {
    router.push(`/reports/team?month=${m}&year=${y}`)
  }

  // 1:1 Weekly Log grouping
  // Group tasks by User, then by Week Of
  const oneOnOneData: any[] = []
  data.tasks.forEach((task: any) => {
    if (task.status === "COMPLETED") return // Only care about open/blocked for 1:1, or maybe all? Let's show all for the month.
    
    const weekOf = format(startOfWeek(new Date(task.startAt), { weekStartsOn: 1 }), "MMM dd, yyyy")
    
    oneOnOneData.push({
      weekOf,
      employeeName: task.user?.name,
      task: task.title,
      status: task.status,
      summary: task.description || "",
      blockers: task.statusReason || (task.status === "BLOCKED" ? "Blocked" : ""),
      actionItem: "-", // No direct field for this, can be inferred or left blank
    })
  })

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Report Month</label>
          <select 
            value={m} 
            onChange={(e) => setM(parseInt(e.target.value))}
            className="h-9 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
          >
            {Array.from({length: 12}, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{new Date(0, n - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Report Year</label>
          <input 
            type="number" 
            value={y} 
            onChange={(e) => setY(parseInt(e.target.value))}
            className="h-9 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm w-24"
          />
        </div>
        <button 
          onClick={handleFilter}
          className="h-9 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Update Dashboard
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Hours Logged</h3>
          <div className="text-3xl font-bold">{data.totalHours.toFixed(1)} <span className="text-base font-normal text-muted-foreground">hrs</span></div>
        </div>
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Tasks Logged</h3>
          <div className="text-3xl font-bold">{data.totalTasks}</div>
        </div>
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Avg Hrs/Person/Day</h3>
          <div className="text-3xl font-bold">{data.avgHoursPerPersonPerDay.toFixed(2)}</div>
        </div>
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Team Utilization</h3>
          <div className="text-3xl font-bold text-primary">{(data.teamUtilizationPercent * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Employee Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-lg">Hours by Employee</h3>
          </div>
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Work Days</TableHead>
                <TableHead className="text-right">Days Off</TableHead>
                <TableHead className="text-right">Total Hrs</TableHead>
                <TableHead className="text-right">Avg Hrs/Day</TableHead>
                <TableHead className="text-right">Utilization %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.employeeStats.map((emp: any) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{emp.role}</TableCell>
                  <TableCell className="text-right">{emp.workingDays}</TableCell>
                  <TableCell className="text-right">{emp.daysOff > 0 ? <span className="text-red-500">{emp.daysOff}</span> : '-'}</TableCell>
                  <TableCell className="text-right">{emp.totalHours.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{emp.avgHrsDay.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{(emp.utilization * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Category Table & Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-lg">Hours by Task Category</h3>
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row items-center p-4">
            <div className="w-full md:w-1/2 h-[250px]">
              {data.categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="totalHours"
                    >
                      {data.categoryStats.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)} hrs`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </div>
            
            <div className="w-full md:w-1/2 mt-4 md:mt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.categoryStats.slice(0, 6).map((cat: any, idx: number) => (
                    <TableRow key={cat.name}>
                      <TableCell className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="truncate max-w-[120px]">{cat.name}</span>
                      </TableCell>
                      <TableCell className="text-right">{cat.totalHours.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{(cat.percentOfTotal * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly 1:1 Log */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-xl text-slate-900 dark:text-white">Weekly 1:1 / Team Meeting Log</h3>
            <p className="text-sm text-muted-foreground mt-1">Review open and blocked tasks for the selected month to run your 1:1s.</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{oneOnOneData.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Open Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{oneOnOneData.filter(d => d.status === "BLOCKED").length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Blocked</div>
            </div>
          </div>
        </div>
        
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
            <TableRow>
              <TableHead className="w-[120px]">Week Of</TableHead>
              <TableHead className="w-[150px]">Employee</TableHead>
              <TableHead className="w-[200px]">Task / Project</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead>Update Summary</TableHead>
              <TableHead className="text-red-500/80">Challenges / Blockers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {oneOnOneData.length > 0 ? oneOnOneData.map((row: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-medium text-xs text-slate-500">{row.weekOf}</TableCell>
                <TableCell className="font-semibold">{row.employeeName}</TableCell>
                <TableCell>{row.task}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${row.status === "BLOCKED" ? "bg-red-500 text-white" : "bg-secondary text-secondary-foreground"}`}>
                    {row.status.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={row.summary}>{row.summary || "-"}</TableCell>
                <TableCell className={`text-sm max-w-[200px] truncate ${row.blockers ? "text-red-500 font-medium" : "text-muted-foreground"}`} title={row.blockers}>
                  {row.blockers || "-"}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No active or blocked tasks found for this month.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
