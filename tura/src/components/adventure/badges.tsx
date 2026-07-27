import { LockIcon, MoonIcon, SunIcon } from "@phosphor-icons/react/ssr";

import { Badge } from "@/components/ui/badge";
import { nightsLabel } from "@/lib/format";
import { STATUS_META, TIER_META } from "@/lib/types";
import type { Status, Tier } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIER_CLASS: Record<Tier, string> = {
  green: "bg-tier-green-soft text-tier-green border-tier-green/30",
  amber: "bg-tier-amber-soft text-tier-amber border-tier-amber/30",
  red: "bg-tier-red-soft text-tier-red border-tier-red/30",
};

export function TierBadge({
  tier,
  showBudget = false,
  className,
}: {
  tier: Tier;
  showBudget?: boolean;
  className?: string;
}) {
  const meta = TIER_META[tier];
  return (
    <Badge className={cn("border", TIER_CLASS[tier], className)}>
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current"
      />
      {meta.label}
      {showBudget && <span className="tabular">£{meta.budget}</span>}
    </Badge>
  );
}

/** The tier dot on its own, for dense rows like the calendar grid. */
export function TierDot({ tier, className }: { tier: Tier; className?: string }) {
  const colour =
    tier === "green"
      ? "bg-tier-green"
      : tier === "amber"
        ? "bg-tier-amber"
        : "bg-tier-red";
  return (
    <span
      aria-hidden="true"
      className={cn("block size-1.5 rounded-full", colour, className)}
    />
  );
}

const STATUS_CLASS: Record<Status, string> = {
  idea: "bg-muted text-muted-foreground",
  shortlisted: "bg-secondary text-secondary-foreground",
  planned: "bg-water/15 text-water dark:text-sky",
  booked: "bg-tier-amber-soft text-tier-amber",
  completed: "bg-tier-green-soft text-tier-green",
  skipped: "bg-muted text-muted-foreground line-through",
};

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <Badge className={cn("border-transparent", STATUS_CLASS[status], className)}>
      {STATUS_META[status].label}
    </Badge>
  );
}

/** "2 nights · adults only" — the composition rule, made visible. */
export function EscapeBadge({
  nights,
  adultsOnly,
  className,
}: {
  nights: number;
  adultsOnly: boolean;
  className?: string;
}) {
  return (
    <Badge variant="muted" className={className}>
      {nights === 0 ? <SunIcon /> : <MoonIcon />}
      {nightsLabel(nights)}
      {adultsOnly && (
        <>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <LockIcon />
          <span>adults only</span>
        </>
      )}
    </Badge>
  );
}

export function RefTag({ refCode, className }: { refCode: string; className?: string }) {
  return (
    <span
      className={cn(
        "text-muted-foreground font-mono text-[0.6875rem] tracking-wider tabular",
        className,
      )}
    >
      {refCode}
    </span>
  );
}
