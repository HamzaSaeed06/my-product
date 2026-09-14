"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { cloneRender } from "@/lib/render-slot"
import { useIsMobile } from "@/hooks/use-mobile"
import { XIcon } from "lucide-react"

const SHEET_DEFAULT_WIDTH = 384 // px, matches the old sm:max-w-sm cap
const SHEET_MIN_WIDTH = 320 // px

// Drag-to-resize handle for a left/right Sheet on desktop only — mobile
// already goes full-width (too narrow to usefully resize), and top/bottom
// sheets resize by height via content, not a drag handle.
function SheetResizeHandle({
  side,
  onResize,
}: {
  side: "left" | "right"
  onResize: (width: number) => void
}) {
  const onPointerDown = (event: React.PointerEvent) => {
    event.preventDefault()
    const onPointerMove = (moveEvent: PointerEvent) => {
      const viewportWidth = window.innerWidth
      const raw =
        side === "right"
          ? viewportWidth - moveEvent.clientX
          : moveEvent.clientX
      const max = viewportWidth / 2 // "center tak" — never past screen center
      onResize(Math.min(max, Math.max(SHEET_MIN_WIDTH, raw)))
    }
    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onPointerDown={onPointerDown}
      className={cn(
        "group/resize absolute inset-y-0 z-10 hidden w-4 cursor-ew-resize touch-none items-center justify-center sm:flex",
        side === "right" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
      )}
    >
      <div className="h-10 w-1.5 rounded-full bg-muted-foreground/35 transition-colors group-hover/resize:bg-muted-foreground/70" />
    </div>
  )
}

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  render,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger> & {
  render?: React.ReactElement
}) {
  return (
    <SheetPrimitive.Trigger data-slot="sheet-trigger" asChild={!!render} {...props}>
      {render ? cloneRender(render, undefined, children) : children}
    </SheetPrimitive.Trigger>
  )
}

function SheetClose({
  render,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close> & {
  render?: React.ReactElement
}) {
  return (
    <SheetPrimitive.Close data-slot="sheet-close" asChild={!!render} {...props}>
      {render ? cloneRender(render, undefined, children) : children}
    </SheetPrimitive.Close>
  )
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  style,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  const isMobile = useIsMobile()
  const [width, setWidth] = React.useState(SHEET_DEFAULT_WIDTH)
  const resizable = !isMobile && (side === "left" || side === "right")

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        style={
          resizable
            ? ({ "--sheet-width": `${width}px`, ...style } as React.CSSProperties)
            : style
        }
        className={cn(
          "fixed z-50 flex w-full flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-[state=open]:slide-in-from-bottom-10 data-[side=bottom]:data-[state=closed]:slide-out-to-bottom-10 data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:border-r data-[side=left]:data-[state=open]:slide-in-from-left-10 data-[side=left]:data-[state=closed]:slide-out-to-left-10 data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:border-l data-[side=right]:data-[state=open]:slide-in-from-right-10 data-[side=right]:data-[state=closed]:slide-out-to-right-10 data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-[state=open]:slide-in-from-top-10 data-[side=top]:data-[state=closed]:slide-out-to-top-10",
          // Only ever emitted when `resizable` is true, which itself
          // requires !isMobile — the sidebar's own Sheet-based mobile
          // drawer (a totally different fixed-width use case) never
          // renders at the same time isMobile is false, so this can never
          // collide with its own w-(--sidebar-width) override, even in the
          // narrow 640-767px band where Tailwind's sm: breakpoint and this
          // hook's 768px mobile cutoff briefly disagree.
          resizable &&
            "sm:data-[side=left]:w-(--sheet-width) sm:data-[side=right]:w-(--sheet-width)",
          className
        )}
        {...props}
      >
        {resizable && (
          <SheetResizeHandle side={side as "left" | "right"} onResize={setWidth} />
        )}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-3 right-3"
              size="icon-sm"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
