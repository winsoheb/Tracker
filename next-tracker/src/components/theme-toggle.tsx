"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-16 h-8 opacity-0" />

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center p-1 w-16 h-8 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-inner backdrop-blur-md transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 overflow-hidden"
      aria-label="Toggle theme"
    >
      <motion.div
        className="absolute w-6 h-6 rounded-full bg-white dark:bg-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.12)] flex items-center justify-center z-10"
        initial={false}
        animate={{ 
          x: isDark ? 32 : 2,
          rotate: isDark ? 360 : 0
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
      </motion.div>
      <div className="w-full flex justify-between px-1.5 text-muted-foreground/40 z-0">
        <Sun className="w-3.5 h-3.5" />
        <Moon className="w-3.5 h-3.5" />
      </div>
    </button>
  )
}
