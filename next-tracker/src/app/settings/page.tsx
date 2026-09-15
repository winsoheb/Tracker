import React from "react"
import { getCategories, getProjects, getSettings } from "@/lib/actions/settings"
import { SettingsTabs } from "@/components/settings/settings-tabs"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SettingsPage() {
  const [categories, projects, settings] = await Promise.all([
    getCategories(),
    getProjects(),
    getSettings()
  ])

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto py-8">
      <header>
        <h1 className="text-3xl font-light tracking-tight mb-2">
          Management & Settings
        </h1>
        <p className="text-muted-foreground tracking-wide">
          Configure your projects, categories, and system preferences.
        </p>
      </header>

      <SettingsTabs 
        initialCategories={categories} 
        initialProjects={projects} 
        initialSettings={settings} 
      />
    </div>
  )
}
