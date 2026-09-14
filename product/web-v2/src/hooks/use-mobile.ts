import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Deliberately starts `false` on every render pass, server AND client,
  // never reading `window` in the initializer. The server always has no
  // window (so it renders the desktop branch), and the very first client
  // render before hydration commits must match that exactly or React
  // treats it as a hydration error — Sidebar's server/client branches
  // (Sheet vs. plain div) differ enough in DOM shape that a mismatch here
  // can abort hydration for the whole sidebar+content tree, which is
  // consistent with "the page loads but nothing is clickable" on phones.
  // The real mobile value is applied a tick later, in the effect below.
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    // Sync immediately on mount too, not just on future "change" events —
    // otherwise a real mobile viewport stays misreported as desktop until
    // the user resizes/rotates, which made the sidebar toggle the wrong
    // (desktop) open state instead of the mobile drawer state.
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
