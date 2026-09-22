"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export function GridView({ tasks }: { tasks: any[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
          <TableRow>
            <TableHead>Task Name</TableHead>
            <TableHead>Bucket</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Project</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Badge variant={task.status === "COMPLETED" ? "default" : "secondary"}>
                  {task.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={task.priority === "HIGH" || task.priority === "URGENT" ? "destructive" : "outline"}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {task.startAt ? format(new Date(task.startAt), "MMM d, yyyy h:mm a") : "-"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {task.endAt ? format(new Date(task.endAt), "MMM d, yyyy h:mm a") : "-"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {task.project?.name || "-"}
              </TableCell>
            </TableRow>
          ))}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No tasks found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
