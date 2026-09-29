"use client"

import React, { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Palette, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateThemeSettings } from "@/lib/actions/settings"

const BRAND_COLORS = [
  { id: "teal", color: "#0d9488" },
  { id: "green", color: "#16a34a" },
  { id: "pink", color: "#ec4899" },
  { id: "orange", color: "#f97316" },
  { id: "amber", color: "#f59e0b" },
  { id: "blue", color: "#3b82f6" },
  { id: "purple", color: "#a855f7" },
]

export function AppearanceSettings({ initialTheme = "dark", initialBrand = "blue" }: { initialTheme?: string, initialBrand?: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentBrand, setCurrentBrand] = useState(initialBrand)
  const [isPending, startTransition] = React.useTransition()

  useEffect(() => {
    setMounted(true)
    // Always sync the html attribute so the live preview works immediately
    document.documentElement.setAttribute("data-brand", currentBrand)
  }, [currentBrand])

  if (!mounted) return null

  const isDark = resolvedTheme === "dark"

  const handleBrandChange = (id: string) => {
    setCurrentBrand(id)
    document.documentElement.setAttribute("data-brand", id)
    startTransition(() => {
      updateThemeSettings(resolvedTheme || "dark", id)
    })
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    startTransition(() => {
      updateThemeSettings(newTheme, currentBrand)
    })
  }

  return (
    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-border space-y-8 mt-6">
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
              onClick={() => handleThemeChange("light")}
            >
              <Sun className="w-4 h-4" /> Light
            </Button>
            <Button
              variant={isDark ? "default" : "outline"}
              className="flex-1 max-w-[200px] gap-2 rounded-xl h-12 border-2"
              onClick={() => handleThemeChange("dark")}
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
                className={`w-12 h-12 rounded-full transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${
                  currentBrand === brand.id 
                    ? "ring-4 ring-offset-4 ring-offset-background scale-110" 
                    : "ring-1 ring-border/50 shadow-sm"
                }`}
                style={{ 
                  backgroundColor: brand.color,
                  '--tw-ring-color': brand.color
                } as React.CSSProperties}
                aria-label={`Select ${brand.id} theme`}
                aria-selected={currentBrand === brand.id}
              >
                {currentBrand === brand.id && (
                  <Check className="w-6 h-6 text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
