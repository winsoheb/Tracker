"use client"

import { useState } from "react"
import { addTimeOff, deleteTimeOff } from "@/lib/actions/timeoff"
import { format } from "date-fns"

export function TimeOffManager({ userId, initialTimeOffs }: { userId: string, initialTimeOffs: any[] }) {
  const [date, setDate] = useState("")
  const [type, setType] = useState("FULL_DAY")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return
    setLoading(true)
    await addTimeOff({
      userId,
      date: new Date(date),
      type,
      reason
    })
    setLoading(false)
    setDate("")
    setReason("")
  }

  const handleDelete = async (id: string) => {
    if (confirm("Remove this time off?")) {
      await deleteTimeOff(id)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg space-y-8 mt-6">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        Leave & Time Off
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-4">Log New Time Off</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
              <input 
                type="date" 
                required 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"
              >
                <option value="FULL_DAY">Full Day Leave</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="HOLIDAY">Public Holiday</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Reason (Optional)</label>
              <input 
                type="text" 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Sick leave, Vacation..."
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Time Off"}
            </button>
          </form>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-4">Upcoming & Recent Leaves</h4>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {initialTimeOffs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg">No time off logged.</p>
            ) : (
              initialTimeOffs.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <p className="text-sm font-semibold">{format(new Date(t.date), "MMM dd, yyyy")}</p>
                    <p className="text-xs text-muted-foreground capitalize flex items-center gap-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${t.type === 'HOLIDAY' ? 'bg-purple-100 text-purple-700' : t.type === 'HALF_DAY' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {t.type.replace('_', ' ')}
                      </span>
                      {t.reason && <span>{t.reason}</span>}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(t.id)} className="text-xs text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
