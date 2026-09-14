import * as React from "react"
import { cn } from "cn"

/**
 * Bridges this codebase's `render={<Element/>}` polymorphism convention
 * (used everywhere, e.g. `<Button render={<Link href="..."/>}>Text</Button>`)
 * onto whatever underlying primitive a `ui/*.tsx` wrapper uses — Radix's own
 * `asChild` clones its single child the same way. Keeping this one helper
 * means call sites never change when the primitive underneath does.
 *
 * Clones `render`, merging `className` (render's own wins by appearing
 * last) and any extra props (event handlers, data-*, aria-*), and uses the
 * wrapper's own `children` if given, falling back to render's own.
 */
export function cloneRender(
  render: React.ReactElement,
  className: string | undefined,
  children: React.ReactNode,
  extraProps?: Record<string, unknown>
): React.ReactElement {
  const el = render as React.ReactElement<{
    className?: string
    children?: React.ReactNode
  }>
  return React.cloneElement(
    el,
    {
      ...extraProps,
      className: cn(className, el.props.className),
    } as Record<string, unknown>,
    children ?? el.props.children
  )
}
