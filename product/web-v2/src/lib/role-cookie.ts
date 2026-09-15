// Same split as sidebar-cookie.ts: plain module (not "use client") so both
// the server layout (reading it to compute the active viewer) and the
// client RoleSwitcher (writing it on change) can import the same name.
export const ROLE_COOKIE_NAME = "mock_role"
export const ROLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
