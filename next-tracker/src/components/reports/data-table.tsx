"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import { formatDuration } from "@/lib/utils"
import { deleteTimeEntry } from "@/lib/actions/timer"
import { EditEntryDialog } from "./edit-entry-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

export function ReportsTable({ entries, categories = [] }: { entries: any[], categories?: any[] }) {
  const [editingEntry, setEditingEntry] = useState<any | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this time entry?")) {
      try {
        await deleteTimeEntry(id)
      } catch (e: any) {
        alert("Failed to delete entry: " + e.message)
      }
    }
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border border-dashed border-white/10 rounded-xl text-muted-foreground/50">
        No time entries found for the selected period.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border border-white/5 bg-background/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-[300px]">Task</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                <TableCell className="font-medium text-foreground">{entry.title}</TableCell>
                <TableCell>
                  {entry.category ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-xs text-muted-foreground border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.category.color || 'var(--color-primary)' }} />
                      {entry.category.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50 text-xs">Uncategorized</span>
                  )}
                </TableCell>
                <TableCell>
                  {entry.project ? (
                    <span className="text-muted-foreground text-sm">{entry.project.name}</span>
                  ) : (
                    <span className="text-muted-foreground/50 text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(entry.startedAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right font-mono text-primary/90">
                  {formatDuration(entry.duration)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      render={
                        <Button variant="ghost" className="h-8 w-8 p-0" />
                      }
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/20 focus:text-destructive" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditEntryDialog 
        entry={editingEntry} 
        categories={categories}
        open={!!editingEntry} 
        onOpenChange={(open) => !open && setEditingEntry(null)} 
      />
    </>
  )
}
