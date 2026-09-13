"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { THEMES, DEFAULT_THEME } from "@/lib/themes";

// Reuses next-themes for what it already does well (no-flash script,
// localStorage persistence) but for swapping between whole design systems
// via [data-theme="<id>"] rather than just light/dark — this project's own
// light/dark handling (the .dark class) stays independent of this.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme={DEFAULT_THEME}
      themes={THEMES.map((t) => t.id)}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
