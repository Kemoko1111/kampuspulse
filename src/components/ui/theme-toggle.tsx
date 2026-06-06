"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      id="theme-toggle"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
      aria-label="Toggle theme"
    >
      <Sun className="w-3.5 h-3.5 hidden dark:block" />
      <Moon className="w-3.5 h-3.5 dark:hidden" />
    </button>
  );
}
