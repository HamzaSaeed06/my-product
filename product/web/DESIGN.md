# Design

## Visual Theme

Precise, confident, institutional — closer to a control panel than a
consumer app. Pure white (light) / near-black (dark) surfaces carry no brand
tint; the brand identity lives entirely in the primary green and the sparing
gold accent, never in the background. This is a deliberate choice: the
"forest-green-on-cream" combination is a well-known generic AI default and
was explicitly avoided.

Deep green was chosen over the more conventional SaaS blue/purple to read as
trustworthy and institutional (education, growth, "in the black") without
tipping into anything playful or organic-crunchy. The gold accent is used
sparingly — badges, highlights, a wordmark detail — never as a structural
color (menu hovers, selected states use neutral tints, not gold).

## Color Palette (OKLCH)

Defined in `src/app/globals.css`. Both light and dark are fully specified;
the app defaults to light (no theme toggle wired up yet — see Open Items).

| Role | Light | Dark | Use |
|---|---|---|---|
| `background` | `oklch(1 0 0)` pure white | `oklch(0.12 0.006 145)` near-black | Page background |
| `foreground` | `oklch(0.19 0.02 145)` | `oklch(0.96 0.01 145)` | Body text |
| `primary` | `oklch(0.32 0.13 142)` deep green | `oklch(0.55 0.14 142)` | Buttons, links, focus rings, brand mark |
| `primary-foreground` | `oklch(0.98 0.01 145)` | `oklch(0.98 0.01 145)` | Text on primary — always near-white |
| `secondary` / `muted` / `accent` | `oklch(0.96 0.006 145)` | `oklch(0.22-0.24 0.01 145)` | Structural tinted-neutral surfaces (inputs, hover states, subtle panels) — intentionally NOT the brand gold |
| `muted-foreground` | `oklch(0.46 0.015 145)` | `oklch(0.65 0.015 145)` | Secondary text |
| `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Errors — kept as shadcn's conventional red, unrelated to brand identity |
| `border` / `input` | `oklch(0.90 0.008 145)` | `oklch(1 0 0 / 10%)` | Borders, input outlines |
| `--brand-accent` (custom, not a shadcn built-in role) | `oklch(0.72 0.14 75)` warm gold | `oklch(0.75 0.14 75)` | Sparing second brand color — badges, highlighted metrics, a wordmark detail. Always paired with white/near-black text per the mid-luminance-saturated-fill rule, never wired into structural hover/select states. |

Color strategy: **Restrained** (tinted neutrals + one accent used sparingly)
— the correct default for product/app-shell register, per the brief's
"clarity over decoration" principle.

## Typography

Geist Sans (shadcn's default for this init) — a single family, multiple
weights. No second display face: this is a utilitarian admin tool, not an
editorial surface, and pairing fonts would add a decision with no payoff
here. Geist's geometric-but-humanist character already reads as "modern,
efficient" per the brand personality.

## Radius

`--radius: 0.5rem` (8px) — tighter than shadcn's 10px default, for a
crisper, more precise feel (Linear-adjacent), consistent with "efficient"
over "soft/friendly."

## Components

shadcn/ui, `nova` style, `neutral` base, Lucide icons — installed as-needed
per screen, not bulk-installed upfront. Installed so far: button, card,
input, label, alert, skeleton, separator, avatar, dropdown-menu, sonner.

## Layout Density

Two calibrations of the same system (per PRODUCT.md's design principles) —
not built yet, noted here for when Teacher/Office/Incharge screens arrive:

- **Desktop admin roles** (Super Admin, Principal, Incharge, Office,
  Teacher): dense, table-heavy, keyboard-friendly.
- **Parent/Student**: mobile-first, simplified, glanceable single-column
  layouts, larger touch targets.

## Open Items

- No dark-mode toggle wired up yet (tokens exist, `.dark` class works, but
  nothing sets it). Add `next-themes` when a theme switcher is actually
  needed.
- No brand mark/logo yet — the login page uses a text wordmark for now.
