// Shared between the client-side sidebar (src/components/ui/sidebar.tsx,
// which writes this cookie on every toggle) and the server-side layouts
// (which read it to restore open/collapsed state on refresh). Deliberately
// NOT exported from sidebar.tsx itself: that file is "use client", and
// values exported from a "use client" module resolve to undefined when
// imported into a Server Component — only this plain module works on both
// sides of that boundary.
export const SIDEBAR_COOKIE_NAME = "sidebar_state"
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
