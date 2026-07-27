"use client";

import * as React from "react";
import { toast } from "sonner";
import { MagnifyingGlassIcon, WarningIcon } from "@phosphor-icons/react/ssr";

import { EscapeBadge, RefTag, TierBadge } from "@/components/adventure/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ADVENTURES, getAdventure } from "@/lib/adventures";
import { formatSlotDate, slotBudget } from "@/lib/calendar";
import { money } from "@/lib/format";
import { useStore } from "@/lib/store";
import { TIER_META } from "@/lib/types";
import type { CalendarSlot } from "@/lib/types";

/**
 * Choose which adventure fills a calendar slot.
 *
 * The body is keyed on the slot id, so opening the sheet for a different date
 * remounts it with an empty search box rather than carrying the last query over.
 */
export function AdventurePickerSheet({
  slot,
  onOpenChange,
}: {
  slot: CalendarSlot | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={slot !== null} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88dvh]">
        {slot && (
          <PickerBody key={slot.id} slot={slot} onOpenChange={onOpenChange} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PickerBody({
  slot,
  onOpenChange,
}: {
  slot: CalendarSlot;
  onOpenChange: (open: boolean) => void;
}) {
  const { assignSlot, state } = useStore();
  const [query, setQuery] = React.useState("");

  const budget = slotBudget(slot);
  const records = state.records;
  const tier = slot.tier;

  /**
   * Sorted so the ones that actually fit the tier's budget come first — the
   * point of the tiers is that a green Saturday does not quietly turn into a
   * £900 weekend.
   */
  const options = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return ADVENTURES.filter((adventure) => {
      const status = records[adventure.id]?.status ?? "idea";
      if (status === "completed" || status === "skipped") return false;
      if (!needle) return true;
      return `${adventure.title} ${adventure.location} ${adventure.region} ${adventure.ref}`
        .toLowerCase()
        .includes(needle);
    }).sort((a, b) => {
      const aFits = a.estimatedCost <= budget;
      const bFits = b.estimatedCost <= budget;
      if (aFits !== bFits) return aFits ? -1 : 1;

      const aTier = a.tier === tier;
      const bTier = b.tier === tier;
      if (aTier !== bTier) return aTier ? -1 : 1;

      return b.popularity - a.popularity;
    });
  }, [tier, query, budget, records]);

  const current = slot.adventureId ? getAdventure(slot.adventureId) : undefined;

  return (
    <>
      <SheetHeader>
        <SheetTitle>{formatSlotDate(slot.date)}</SheetTitle>
        <SheetDescription>
          {TIER_META[tier].label} slot · {money(budget)} budget ·{" "}
          {TIER_META[tier].cadence.toLowerCase()}
        </SheetDescription>
      </SheetHeader>

      <div className="relative">
        <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the catalogue"
          aria-label="Search adventures"
          className="pl-9"
        />
      </div>

      <ul className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1">
        {options.map((adventure) => {
          const over = adventure.estimatedCost - budget;
          const isCurrent = adventure.id === slot.adventureId;

          return (
            <li key={adventure.id}>
              <button
                type="button"
                onClick={() => {
                  assignSlot(slot, isCurrent ? null : adventure.id);
                  toast.success(
                    isCurrent
                      ? `${formatSlotDate(slot.date)} cleared`
                      : `${adventure.ref} booked for ${formatSlotDate(slot.date)}`,
                  );
                  onOpenChange(false);
                }}
                aria-pressed={isCurrent}
                className="hover:bg-accent focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10 w-full rounded-lg border border-transparent p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <div className="flex items-center gap-2">
                  <RefTag refCode={adventure.ref} />
                  <span className="text-muted-foreground truncate text-xs">
                    {adventure.region}
                  </span>
                </div>
                <p className="mt-0.5 text-sm leading-snug font-medium">
                  {adventure.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <TierBadge tier={adventure.tier} />
                  <EscapeBadge
                    nights={adventure.nights}
                    adultsOnly={adventure.adultsOnly}
                  />
                  <span className="text-muted-foreground text-xs tabular">
                    {money(adventure.estimatedCost)}
                  </span>
                </div>
                {over > 0 && (
                  <p className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
                    <WarningIcon className="text-bracken size-3.5 shrink-0" />
                    {money(over)} over this slot&rsquo;s budget
                  </p>
                )}
              </button>
            </li>
          );
        })}

        {options.length === 0 && (
          <li className="text-muted-foreground py-8 text-center text-sm">
            Nothing in the catalogue matches that.
          </li>
        )}
      </ul>

      {current && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            assignSlot(slot, null);
            toast(`${formatSlotDate(slot.date)} cleared`);
            onOpenChange(false);
          }}
        >
          Clear this date
        </Button>
      )}
    </>
  );
}
