'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"
        aria-label="Cambiar tema"
      >
        <Sun className="h-4 w-4 text-white/70" />
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-white/70 hover:text-white transition-colors" />
      ) : (
        <Moon className="h-4 w-4 text-white/70 hover:text-white transition-colors" />
      )}
    </button>
  )
}
