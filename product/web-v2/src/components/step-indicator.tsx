import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  label: string;
  description?: string;
}

// The shared step indicator for every genuinely multi-step flow in this
// build (a dedicated route, not a form crammed into a modal, per the
// interaction-pattern rules) — New Admission and Convert Inquiry both use
// this so the "what step am I on" affordance stays identical everywhere
// a wizard appears, the same way DataTable keeps every list screen
// consistent.
export function StepIndicator({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <ol className="flex items-start">
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <li key={step.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "active" && "border-primary text-primary",
                  state === "upcoming" && "border-border text-muted-foreground"
                )}
              >
                {state === "done" ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "max-w-24 text-center text-xs",
                  state === "upcoming" ? "text-muted-foreground" : "font-medium text-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <div className={cn("mx-2 h-px flex-1 self-start mt-3.5", state === "done" ? "bg-primary" : "bg-border")} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
