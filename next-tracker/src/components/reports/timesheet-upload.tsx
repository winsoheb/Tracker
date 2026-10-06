"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import * as XLSX from "xlsx"
import { importTimesheetData } from "@/lib/actions/timesheet"
import { useRouter } from "next/navigation"

export function TimesheetUpload() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)

        const result = await importTimesheetData(json)
        alert(`Import complete!\nSuccessfully imported: ${result.success}\nSkipped/Errors: ${result.skipped}\n\n${result.errors.join('\n')}`)
        router.refresh()
      } catch (err: any) {
        alert(`Error parsing Excel file: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="relative inline-block">
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        disabled={loading}
      />
      <Button variant="outline" disabled={loading}>
        <Upload className="w-4 h-4 mr-2" />
        {loading ? "Importing..." : "Import Excel Timesheet"}
      </Button>
    </div>
  )
}
