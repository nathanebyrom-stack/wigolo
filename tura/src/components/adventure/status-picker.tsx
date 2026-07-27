"use client";

import { CheckIcon } from "@phosphor-icons/react/ssr";

import { STATUSES, STATUS_META } from "@/lib/types";
import type { Status } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACTIVE_CLASS: Record<Status, string> = {
  idea: "bg-muted text-foreground border-border",
  shortlisted: "bg-secondary text-secondary-foreground border-border",
  planned: "bg-water/20 text-water dark:text-sky border-water/40",
  booked: "bg-tier-amber-soft text-tier-amber border-tier-amber/40",
  completed: "bg-tier-green-soft text-tier-green border-tier-green/40",
  skipped: "bg-muted text-muted-foreground border-border",
};

/**
 * Status tracking for one adventure.
 *
 * A radiogroup rather than a set of buttons: exactly one applies at a time, and
 * arrow keys should move between them.
 */
export function StatusPicker({
  value,
  onChange,
  label = "Status",
}: {
  value: Status;
  onChange: (status: Status) => void;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {STATUSES.map((status) => {
        const active = status === value;
        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={active}
            title={STATUS_META[status].description}
            onClick={() => onChange(status)}
            className={cn(
              "focus-visible:outline-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
              active
                ? ACTIVE_CLASS[status]
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {active && <CheckIcon className="size-3" weight="bold" />}
            {STATUS_META[status].label}
          </button>
        );
      })}
    </div>
  );
}
