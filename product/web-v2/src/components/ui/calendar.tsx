"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayButton, getDefaultClassNames } from "react-day-picker"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn("p-2.5", className)}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex flex-col gap-3", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
        nav: cn("flex items-center justify-between", defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "absolute left-0",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "absolute right-0",
          defaultClassNames.button_next
        ),
        month_caption: cn("flex h-7 items-center justify-center", defaultClassNames.month_caption),
        dropdowns: cn("flex items-center gap-1.5 text-sm font-medium", defaultClassNames.dropdowns),
        dropdown_root: cn(
          "rounded-[var(--button-radius)] border border-border has-focus:ring-3 has-focus:ring-ring/50",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("bg-popover", defaultClassNames.dropdown),
        caption_label: cn("text-sm font-medium text-foreground", defaultClassNames.caption_label),
        month_grid: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn("w-8 text-[0.8rem] font-normal text-muted-foreground", defaultClassNames.weekday),
        week: cn("mt-1.5 flex w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square size-8 p-0 text-center text-sm [&:first-child[data-selected=true]_button]:rounded-l-[var(--button-radius)] [&:last-child[data-selected=true]_button]:rounded-r-[var(--button-radius)]",
          defaultClassNames.day
        ),
        range_start: cn("rounded-l-[var(--button-radius)] bg-accent", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-[var(--button-radius)] bg-accent", defaultClassNames.range_end),
        today: cn("text-foreground data-[selected=true]:text-primary-foreground", defaultClassNames.today),
        outside: cn("text-muted-foreground/50 aria-selected:text-muted-foreground/50", defaultClassNames.outside),
        disabled: cn("text-muted-foreground/40 opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...chevronProps }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icon className={cn("size-4", className)} {...chevronProps} />
        },
        DayButton: CalendarDayButton,
        ...props.components,
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
      data-selected={modifiers.selected}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "flex aspect-square size-auto w-full min-w-8 flex-col items-center justify-center gap-1 leading-none",
        "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:hover:bg-primary",
        "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-foreground",
        "data-[range-start=true]:rounded-r-none data-[range-end=true]:rounded-l-none",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
