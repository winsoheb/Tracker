"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Save } from "lucide-react"
import { createCategory, deleteCategory, createProject, deleteProject, updateSettings } from "@/lib/actions/settings"

type Category = any
type Project = any
type Settings = any

export function SettingsTabs({ 
  initialCategories, 
  initialProjects, 
  initialSettings 
}: { 
  initialCategories: Category[], 
  initialProjects: Project[], 
  initialSettings: Settings 
}) {
  const [categories, setCategories] = useState(initialCategories)
  const [projects, setProjects] = useState(initialProjects)
  
  // Forms state
  const [newCatName, setNewCatName] = useState("")
  const [newCatColor, setNewCatColor] = useState("#3b82f6")
  
  const [newProjName, setNewProjName] = useState("")
  const [newProjCat, setNewProjCat] = useState("")
  
  const [dailyGoal, setDailyGoal] = useState(initialSettings?.dailyGoalHours || 8)
  const [notifications, setNotifications] = useState(initialSettings?.notifications ?? true)

  const handleAddCategory = async () => {
    if (!newCatName) return
    const cat = await createCategory({ name: newCatName, color: newCatColor })
    setCategories([cat, ...categories])
    setNewCatName("")
  }

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id)
    setCategories(categories.filter(c => c.id !== id))
  }

  const handleAddProject = async () => {
    if (!newProjName) return
    const proj = await createProject({ name: newProjName, categoryId: newProjCat || undefined })
    setProjects([proj, ...projects])
    setNewProjName("")
  }

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id)
    setProjects(projects.filter(p => p.id !== id))
  }

  const handleSaveSettings = async () => {
    await updateSettings({ dailyGoalHours: Number(dailyGoal), notifications })
    alert("Settings saved successfully!")
  }

  return (
    <Tabs defaultValue="projects" className="w-full">
      <TabsList className="mb-6 bg-white/5 border border-white/10 rounded-xl p-1 h-auto">
        <TabsTrigger value="projects" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Projects</TabsTrigger>
        <TabsTrigger value="categories" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Categories</TabsTrigger>
        <TabsTrigger value="preferences" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Preferences</TabsTrigger>
      </TabsList>

      {/* PROJECTS TAB */}
      <TabsContent value="projects" className="space-y-6 outline-none">
        <div className="glass p-6 rounded-2xl shadow-xl flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label>New Project Name</Label>
            <Input 
              value={newProjName} 
              onChange={e => setNewProjName(e.target.value)} 
              placeholder="e.g. Website Redesign" 
              className="bg-background/50 border-white/10"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label>Assign Category</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={newProjCat}
              onChange={e => setNewProjCat(e.target.value)}
            >
              <option value="">No Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Button onClick={handleAddProject} className="h-10 px-8 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Project
          </Button>
        </div>

        <div className="glass rounded-2xl shadow-xl overflow-hidden divide-y divide-white/5">
          {projects.length === 0 && <div className="p-8 text-center text-muted-foreground/50">No projects created yet.</div>}
          {projects.map(proj => (
            <div key={proj.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div>
                <h4 className="font-medium text-foreground">{proj.name}</h4>
                <p className="text-sm text-muted-foreground">{proj.category?.name || "Uncategorized"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(proj.id)} className="text-muted-foreground hover:text-rose-400">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </TabsContent>

      {/* CATEGORIES TAB */}
      <TabsContent value="categories" className="space-y-6 outline-none">
        <div className="glass p-6 rounded-2xl shadow-xl flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label>New Category Name</Label>
            <Input 
              value={newCatName} 
              onChange={e => setNewCatName(e.target.value)} 
              placeholder="e.g. Deep Work" 
              className="bg-background/50 border-white/10"
            />
          </div>
          <div className="w-32 space-y-2">
            <Label>Color</Label>
            <Input 
              type="color" 
              value={newCatColor} 
              onChange={e => setNewCatColor(e.target.value)} 
              className="bg-background/50 border-white/10 h-10 w-full p-1 cursor-pointer"
            />
          </div>
          <Button onClick={handleAddCategory} className="h-10 px-8 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
        </div>

        <div className="glass rounded-2xl shadow-xl overflow-hidden divide-y divide-white/5">
          {categories.length === 0 && <div className="p-8 text-center text-muted-foreground/50">No categories created yet.</div>}
          {categories.map(cat => (
            <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <h4 className="font-medium text-foreground">{cat.name}</h4>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} className="text-muted-foreground hover:text-rose-400">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </TabsContent>

      {/* PREFERENCES TAB */}
      <TabsContent value="preferences" className="space-y-6 outline-none">
        <div className="glass p-8 rounded-2xl shadow-xl max-w-2xl space-y-8">
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-medium">Daily Focus Goal (Hours)</Label>
              <p className="text-sm text-muted-foreground mb-4">Set your daily target for deep work. This drives the dashboard progress ring.</p>
              <Input 
                type="number" 
                value={dailyGoal} 
                onChange={e => setDailyGoal(Number(e.target.value))} 
                className="bg-background/50 border-white/10 max-w-[200px]"
                min={1}
                max={24}
              />
            </div>
            
            <div className="pt-4 flex items-center justify-between border-t border-white/5">
              <div>
                <Label className="text-lg font-medium">System Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive browser alerts when timers finish or breaks end.</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </div>

          <Button onClick={handleSaveSettings} className="w-full shadow-lg shadow-primary/20">
            <Save className="w-4 h-4 mr-2" /> Save Preferences
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}
