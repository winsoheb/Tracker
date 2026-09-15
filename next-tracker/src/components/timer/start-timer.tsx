"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Play, Loader2, Tags } from "lucide-react"
import { useTimer } from "@/hooks/use-timer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function StartTimer(props: ReturnType<typeof useTimer> & { categories?: any[] }) {
  const { timer, handleStart, isPending, isLoading, categories = [] } = props
  const [title, setTitle] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)

  if (isLoading || timer) return null

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await handleStart({ title, categoryId: categoryId || undefined })
    setTitle("")
    setCategoryId(null)
  }

  const selectedCategory = categories.find(c => c.id === categoryId)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={onSubmit} className="relative group">
        {/* Glow effect behind the input */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        
        <div className="relative flex items-center glass-panel p-2 rounded-2xl bg-background/80">
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you working on?"
            className="border-0 bg-transparent text-lg shadow-none focus-visible:ring-0 px-4 placeholder:text-muted-foreground/50 h-14"
            disabled={isPending}
          />
          
          <div className="flex items-center gap-2 pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger 
                render={
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className={`transition-colors h-10 w-10 ${categoryId ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                    title={selectedCategory ? `Category: ${selectedCategory.name}` : "Add Category"}
                  />
                }
              >
                {selectedCategory ? (
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
                ) : (
                  <Tags className="w-5 h-5" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setCategoryId(null)}>
                  <Tags className="mr-2 h-4 w-4" />
                  None (Uncategorized)
                </DropdownMenuItem>
                {categories.map(cat => (
                  <DropdownMenuItem key={cat.id} onClick={() => setCategoryId(cat.id)}>
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              type="submit" 
              disabled={isPending || !title.trim()}
              className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" fill="currentColor" />}
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  )
}
