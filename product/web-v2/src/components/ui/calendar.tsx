"use client"

import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames, type DayButton } from "react-day-picker"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"

// A close port of shadcn's own calendar.tsx (react-day-picker v9+ API),
// re-skinned onto this project's own tokens (--button-radius instead of
// rounded-md, project Button variants) rather than shadcn's defaults. Two
// details are load-bearing, not decorative, and got this wrong on the
// first pass: `nav` must be absolutely positioned over a `relative`
// `months`/`month` ancestor (react-day-picker centers month_caption
// separately; nav's prev/next buttons overlay it rather than sitting
// beside it in flow), and `dropdown` (the native <select> used for
// captionLayout="dropdown") must stay an invisible absolute overlay on
// top of the visible caption_label, not a normal visible box — giving it
// a real background renders a second, ugly native dropdown next to the
// custom-styled one instead of replacing it.
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn(
        // --cell-size at spacing(7) (28px) matches this app's compact
        // control scale (icon-sm buttons, h-7 inputs) rather than
        // shadcn's own default of spacing(8) — the earlier port used
        // shadcn's literal size and read as noticeably oversized next to
        // the rest of this app's tighter density.
        "bg-background p-2 [--cell-size:--spacing(7)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        className
      )}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-2.5 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-2.5", defaultClassNames.month),
        nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "size-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "size-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn("flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium", defaultClassNames.dropdowns),
        dropdown_root: cn(
          "relative rounded-[var(--button-radius)] border border-border has-focus:ring-3 has-focus:ring-ring/50",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("absolute inset-0 bg-popover opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none text-xs font-medium",
          captionLayout !== "label" &&
            "flex h-7 items-center gap-1 rounded-[var(--button-radius)] pr-1 pl-2 [&>svg]:size-3 [&>svg]:text-muted-foreground",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn("flex-1 select-none rounded-[var(--button-radius)] text-[0.7rem] font-normal text-muted-foreground", defaultClassNames.weekday),
        week: cn("mt-1 flex w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-[var(--button-radius)] [&:last-child[data-selected=true]_button]:rounded-r-[var(--button-radius)]",
          defaultClassNames.day
        ),
        range_start: cn("rounded-l-[var(--button-radius)] bg-accent", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-[var(--button-radius)] bg-accent", defaultClassNames.range_end),
        today: cn("rounded-[var(--button-radius)] bg-accent text-accent-foreground data-[selected=true]:rounded-none", defaultClassNames.today),
        outside: cn("text-muted-foreground aria-selected:text-muted-foreground", defaultClassNames.outside),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(className)} {...rootProps} />
        ),
        Chevron: ({ className, orientation, ...chevronProps }) => {
          if (orientation === "left") return <ChevronLeft className={cn("size-4", className)} {...chevronProps} />
          if (orientation === "right") return <ChevronRight className={cn("size-4", className)} {...chevronProps} />
          return <ChevronDown className={cn("size-4", className)} {...chevronProps} />
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      data-day={day.date.toLocaleDateString()}
      data-selected-single={modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 rounded-[var(--button-radius)] font-normal leading-none",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-3 group-data-[focused=true]/day:ring-ring/50",
        "data-[range-end=true]:rounded-[var(--button-radius)] data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
        "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
        "data-[range-start=true]:rounded-[var(--button-radius)] data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
