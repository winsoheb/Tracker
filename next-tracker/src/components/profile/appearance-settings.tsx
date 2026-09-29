"use client"

import React, { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"

const BRAND_COLORS = [
  { id: "teal", color: "#0d9488" },
  { id: "green", color: "#16a34a" },
  { id: "pink", color: "#ec4899" },
  { id: "mint", color: "#14b8a6" },
  { id: "orange", color: "#f97316" },
  { id: "blue", color: "#3b82f6" },
  { id: "purple", color: "#a855f7" },
]

export function AppearanceSettings() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentBrand, setCurrentBrand] = useState("purple")

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("workorbit-brand-theme") || "purple"
    setCurrentBrand(saved)
    document.documentElement.setAttribute("data-brand", saved)
  }, [])

  if (!mounted) return null

  const isDark = resolvedTheme === "dark"

  const handleBrandChange = (id: string) => {
    setCurrentBrand(id)
    localStorage.setItem("workorbit-brand-theme", id)
    document.documentElement.setAttribute("data-brand", id)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg space-y-8 mt-6">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <Palette className="w-5 h-5 text-primary" /> Appearance
      </h3>

      <div className="space-y-8">
        <div>
          <h4 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-4 flex items-center gap-2">
            <Sun className="w-4 h-4" /> Theme Mode
          </h4>
          <div className="flex gap-4">
            <Button
              variant={!isDark ? "default" : "outline"}
              className="flex-1 max-w-[200px] gap-2 rounded-xl h-12 border-2"
              onClick={() => setTheme("light")}
            >
              <Sun className="w-4 h-4" /> Light
            </Button>
            <Button
              variant={isDark ? "default" : "outline"}
              className="flex-1 max-w-[200px] gap-2 rounded-xl h-12 border-2"
              onClick={() => setTheme("dark")}
            >
              <Moon className="w-4 h-4" /> Dark
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4" /> Brand Palette Theme
          </h4>
          <div className="flex flex-wrap gap-4">
            {BRAND_COLORS.map((brand) => (
              <button
                key={brand.id}
                onClick={() => handleBrandChange(brand.id)}
                className={`w-10 h-10 rounded-full transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${
                  currentBrand === brand.id 
                    ? "ring-4 ring-offset-2 ring-offset-background scale-110" 
                    : "ring-0"
                }`}
                style={{ 
                  backgroundColor: brand.color,
                  '--tw-ring-color': brand.color
                } as React.CSSProperties}
                aria-label={`Select ${brand.id} theme`}
              >
                {currentBrand === brand.id && (
                  <div className="w-2 h-2 rounded-full bg-white opacity-90" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
