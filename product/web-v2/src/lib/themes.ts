// Registry of design systems the user is comparing side by side (Phase A
// design review). Each entry gets its own `[data-theme="<id>"]` token block
// in globals.css and shows up as one option in the ThemeSwitcher. When a new
// design system is pasted in, add its tokens to globals.css and one entry
// here — nothing else needs to change. At the end of the review, whichever
// one is kept becomes the only entry and this registry can shrink back down.
export interface ThemeOption {
  id: string;
  label: string;
}

export const THEMES: ThemeOption[] = [{ id: "vercel-geist", label: "Vercel Geist" }];

export const DEFAULT_THEME = THEMES[0].id;
