"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Palette } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THEMES, DEFAULT_THEME } from "@/lib/themes";

// Top-right design-system switcher for the Phase A/B review period — lets
// the user flip between every design system they've pasted in and pick a
// winner at the end, without needing a rebuild between each one. Not part
// of the shipped product surface; safe to delete once one design is final.
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes only knows the real value after mount (it reads
  // localStorage client-side) — render a stable default until then so the
  // server- and first-client-render markup match. This is next-themes' own
  // documented mount-detection pattern; the setState-in-effect it requires
  // is intentional here, not an accidental synchronization loop.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const value = mounted ? (theme ?? DEFAULT_THEME) : DEFAULT_THEME;

  return (
    <Select value={value} onValueChange={(v) => setTheme(v ?? DEFAULT_THEME)}>
      <SelectTrigger className="w-40 gap-1.5" size="sm" aria-label="Switch design">
        <Palette className="size-3.5 text-muted-foreground" />
        <SelectValue>{(v: string) => THEMES.find((t) => t.id === v)?.label ?? v}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {THEMES.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
