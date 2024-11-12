import { Button } from '@/components/ui/button'
import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect, forwardRef } from 'react'

export const ThemeToggle = forwardRef<
  HTMLButtonElement,
  {
    className?: string
  }
>(({ className, ...props }, ref) => {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      {...props}
      ref={ref}
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'light' ? (
        <SunIcon className="h-4 w-4 md:h-5 md:w-5" />
      ) : (
        <MoonIcon className="h-4 w-4 md:h-5 md:w-5" />
      )}
    </Button>
  )
})

ThemeToggle.displayName = 'ThemeToggle'
