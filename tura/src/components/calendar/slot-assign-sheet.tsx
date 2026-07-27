"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckIcon, WarningIcon } from "@phosphor-icons/react/ssr";

import { TierBadge } from "@/components/adventure/badges";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getAdventure } from "@/lib/adventures";
import { formatSlotDate, isPast, slotBudget } from "@/lib/calendar";
import { money } from "@/lib/format";
import { useStore } from "@/lib/store";
import { TIER_META } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Choose which calendar slot an adventure goes into.
 *
 * Slots already holding a different adventure are still selectable — picking one
 * replaces what is there, and the sheet says so rather than hiding the option.
 */
export function SlotAssignSheet({
  open,
  onOpenChange,
  adventureId,
  year,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adventureId: string;
  year: number;
}) {
  const { slotsFor, assignSlot, state } = useStore();
  const adventure = getAdventure(adventureId);

  const slots = React.useMemo(() => {
    const all = [...slotsFor(year), ...slotsFor(year + 1)];
    return all.filter((slot) => !isPast(slot.date));
  }, [slotsFor, year]);

  const currentSlotId = React.useMemo(
    () =>
      Object.values(state.slots).find((slot) => slot.adventureId === adventureId)
        ?.id,
    [state.slots, adventureId],
  );

  if (!adventure) return null;

  const overBudget = (budget: number) => adventure.estimatedCost > budget;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh]">
        <SheetHeader>
          <SheetTitle>Pick a date for {adventure.ref}</SheetTitle>
          <SheetDescription>
            {adventure.title} — typically {money(adventure.estimatedCost)} for two.
          </SheetDescription>
        </SheetHeader>

        <ul className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1">
          {slots.map((slot) => {
            const budget = slotBudget(slot);
            const occupant = slot.adventureId
              ? getAdventure(slot.adventureId)
              : undefined;
            const isCurrent = slot.id === currentSlotId;
            const tight = overBudget(budget);

            return (
              <li key={slot.id}>
                <button
                  type="button"
                  onClick={() => {
                    assignSlot(slot, isCurrent ? null : adventure.id);
                    toast.success(
                      isCurrent
                        ? `${adventure.ref} removed from ${formatSlotDate(slot.date)}`
                        : `${adventure.ref} booked for ${formatSlotDate(slot.date)}`,
                    );
                    onOpenChange(false);
                  }}
                  className={cn(
                    "hover:bg-accent focus-visible:outline-ring flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                    isCurrent
                      ? "border-primary bg-primary/10"
                      : "border-transparent",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatSlotDate(slot.date)}
                      </span>
                      <span className="text-muted-foreground text-xs tabular">
                        {slot.date.slice(0, 4)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <TierBadge tier={slot.tier} />
                      <span className="text-muted-foreground text-xs tabular">
                        {money(budget)} budget
                      </span>
                    </div>
                    {occupant && !isCurrent && (
                      <p className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
                        <WarningIcon className="text-bracken size-3.5 shrink-0" />
                        Replaces {occupant.ref} — {occupant.title}
                      </p>
                    )}
                    {tight && !occupant && (
                      <p className="text-muted-foreground mt-1.5 text-xs">
                        {money(adventure.estimatedCost - budget)} over the{" "}
                        {TIER_META[slot.tier].label.toLowerCase()} budget
                      </p>
                    )}
                  </div>

                  {isCurrent && (
                    <span className="text-primary flex items-center gap-1 text-xs font-medium">
                      <CheckIcon className="size-4" weight="bold" />
                      Booked
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {currentSlotId && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const slot = slots.find((s) => s.id === currentSlotId);
              if (slot) assignSlot(slot, null);
              toast(`${adventure.ref} taken out of the calendar`);
              onOpenChange(false);
            }}
          >
            Take it out of the calendar
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
