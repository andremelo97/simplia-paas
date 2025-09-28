import * as React from "react"

// --- UI Primitives ---
import { Button } from "@shared/components/tiptap-ui-primitive/button"

// --- Icons ---
import { MoonStarIcon } from "@shared/tiptap-icons/moon-star-icon"
import { SunIcon } from "@shared/tiptap-icons/sun-icon"

export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Force light mode as default, ignore system preference
    setIsDarkMode(false)
  }, [])

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode)
  }, [isDarkMode])

  const toggleDarkMode = () => setIsDarkMode((isDark) => !isDark)

  return (
    <Button
      type="button"
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      data-style="ghost"
    >
      {isDarkMode ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  )
}
