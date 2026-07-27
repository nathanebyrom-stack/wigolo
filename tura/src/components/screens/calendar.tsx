"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  CaretLeftIcon,
  CaretRightIcon,
  PlusIcon,
} from "@phosphor-icons/react/ssr";

import { AdventurePickerSheet } from "@/components/calendar/adventure-picker-sheet";
import { RefTag, TierDot } from "@/components/adventure/badges";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getAdventure } from "@/lib/adventures";
import {
  formatCountdown,
  formatSlotDate,
  isPast,
  monthWeeks,
  MONTH_NAMES,
  slotBudget,
  toISODate,
  WEEKDAY_INITIALS,
  WEEKDAY_NAMES,
} from "@/lib/calendar";
import { money, nightsLabel } from "@/lib/format";
import { useStore } from "@/lib/store";
import { TIERS, TIER_META } from "@/lib/types";
import type { CalendarSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CalendarScreen() {
  const { slotsFor, hydrated } = useStore();
  const reduceMotion = useReducedMotion();

  const today = React.useMemo(() => new Date(), []);
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());
  const [pickerSlot, setPickerSlot] = React.useState<CalendarSlot | null>(null);
  const [daySlots, setDaySlots] = React.useState<CalendarSlot[] | null>(null);

  const slots = React.useMemo(() => slotsFor(year), [slotsFor, year]);

  const slotsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarSlot[]>();
    for (const slot of slots) {
      const existing = map.get(slot.date);
      if (existing) existing.push(slot);
      else map.set(slot.date, [slot]);
    }
    return map;
  }, [slots]);

  const weeks = React.useMemo(
    () => monthWeeks(year, month, today),
    [year, month, today],
  );

  const monthSlots = React.useMemo(
    () =>
      slots.filter((slot) => {
        const [slotYear, slotMonth] = slot.date.split("-").map(Number);
        return slotYear === year && slotMonth - 1 === month;
      }),
    [slots, year, month],
  );

  const upcoming = React.useMemo(() => {
    const todayISO = toISODate(today);
    return slots.filter((slot) => slot.date >= todayISO).slice(0, 5);
  }, [slots, today]);

  const yearTotal = React.useMemo(
    () =>
      slots
        .filter((slot) => slot.adventureId)
        .reduce((sum, slot) => sum + slotBudget(slot), 0),
    [slots],
  );

  const step = (delta: number) => {
    const next = month + delta;
    if (next < 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else if (next > 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth(next);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Nineteen dates a year, already chosen. Twelve green Saturdays, six
          amber, and the birthday.
        </p>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-2">
        {TIERS.map((tier) => {
          const meta = TIER_META[tier];
          const filled = slots.filter(
            (slot) => slot.tier === tier && slot.adventureId,
          ).length;
          const total = slots.filter((slot) => slot.tier === tier).length;

          return (
            <div
              key={tier}
              className={cn(
                "rounded-lg border p-3",
                tier === "green" && "border-tier-green/30 bg-tier-green-soft/40",
                tier === "amber" && "border-tier-amber/30 bg-tier-amber-soft/40",
                tier === "red" && "border-tier-red/30 bg-tier-red-soft/40",
              )}
            >
              <div className="flex items-center gap-1.5">
                <TierDot tier={tier} />
                <span className="text-xs font-semibold">{meta.label}</span>
              </div>
              <p className="mt-1.5 text-sm font-semibold tabular">
                {filled}
                <span className="text-muted-foreground font-normal">/{total}</span>
              </p>
              <p className="text-muted-foreground text-[0.6875rem] tabular">
                {money(meta.budget)} each
              </p>
            </div>
          );
        })}
      </div>

      <section aria-labelledby="grid-heading" className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="grid-heading" className="text-lg font-semibold">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => step(-1)}
              aria-label="Previous month"
            >
              <CaretLeftIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setYear(today.getFullYear());
                setMonth(today.getMonth());
              }}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => step(1)}
              aria-label="Next month"
            >
              <CaretRightIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div
          role="grid"
          aria-label={`${MONTH_NAMES[month]} ${year}`}
          className="bg-card overflow-hidden rounded-xl border"
        >
          <div role="row" className="grid grid-cols-7 border-b">
            {WEEKDAY_INITIALS.map((initial, index) => (
              <div
                key={index}
                role="columnheader"
                className="text-muted-foreground py-2 text-center text-[0.6875rem] font-medium"
              >
                <span aria-hidden="true">{initial}</span>
                <span className="sr-only">{WEEKDAY_NAMES[index]}</span>
              </div>
            ))}
          </div>

          {weeks.map((week, weekIndex) => (
            <div role="row" key={weekIndex} className="grid grid-cols-7">
              {week.map((cell) => {
                const cellSlots = slotsByDate.get(cell.date) ?? [];
                const day = Number(cell.date.slice(8));
                const past = isPast(cell.date, today);

                const content = (
                  <>
                    <span
                      className={cn(
                        "text-sm tabular",
                        // Dimming with opacity would drop these below the
                        // contrast threshold, so out-of-month days are marked
                        // by colour and past days by the cell background.
                        cell.inMonth ? "text-foreground" : "text-muted-foreground",
                        cell.isToday && "text-primary font-bold",
                      )}
                    >
                      {day}
                    </span>
                    <span className="mt-1 flex h-1.5 items-center gap-0.5">
                      {cellSlots.map((slot) => (
                        <TierDot
                          key={slot.id}
                          tier={slot.tier}
                          className={slot.adventureId ? "" : "opacity-50"}
                        />
                      ))}
                    </span>
                  </>
                );

                if (cellSlots.length === 0) {
                  return (
                    <div
                      key={cell.date}
                      role="gridcell"
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center border-t border-r last:border-r-0",
                        past && "bg-muted/50",
                        cell.isToday && "bg-primary/10",
                      )}
                    >
                      {content}
                    </div>
                  );
                }

                const labels = cellSlots
                  .map((slot) => {
                    const adventure = slot.adventureId
                      ? getAdventure(slot.adventureId)
                      : null;
                    return adventure
                      ? `${TIER_META[slot.tier].label}: ${adventure.ref} ${adventure.title}`
                      : `${TIER_META[slot.tier].label}: open`;
                  })
                  .join("; ");

                return (
                  <button
                    key={cell.date}
                    type="button"
                    role="gridcell"
                    onClick={() => setDaySlots(cellSlots)}
                    aria-label={`${formatSlotDate(cell.date)} — ${labels}`}
                    className={cn(
                      "hover:bg-accent focus-visible:outline-ring flex aspect-square flex-col items-center justify-center border-t border-r transition-colors last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2",
                      past && "bg-muted/50",
                      cell.isToday && "bg-primary/10",
                    )}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {monthSlots.length > 0 && (
          <ul className="mt-3 space-y-2">
            {monthSlots.map((slot) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                onPick={() => setPickerSlot(slot)}
                reduceMotion={Boolean(reduceMotion)}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="upcoming-heading" className="mb-6">
        <h2 id="upcoming-heading" className="mb-3 text-lg font-semibold">
          What is coming
        </h2>
        {hydrated && upcoming.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border p-4 text-sm">
            No dates left this year. Step the calendar into {year + 1}.
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((slot) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                showCountdown
                onPick={() => setPickerSlot(slot)}
                reduceMotion={Boolean(reduceMotion)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="border-t pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground text-sm">
            Committed for {year}
          </span>
          <span className="text-lg font-semibold tabular">
            {money(yearTotal)}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Sum of the budgets on every filled date.{" "}
          <Link href="/budget" className="text-primary underline underline-offset-4">
            Track what actually gets spent
          </Link>
          .
        </p>
      </section>

      <AdventurePickerSheet
        slot={pickerSlot}
        onOpenChange={(open) => !open && setPickerSlot(null)}
      />

      <Sheet
        open={daySlots !== null}
        onOpenChange={(open) => !open && setDaySlots(null)}
      >
        <SheetContent side="bottom">
          {daySlots && daySlots.length > 0 && (
            <>
              <SheetHeader>
                <SheetTitle>{formatSlotDate(daySlots[0].date)}</SheetTitle>
                <SheetDescription>
                  {formatCountdown(daySlots[0].date, today)}
                </SheetDescription>
              </SheetHeader>
              <ul className="space-y-2">
                {daySlots.map((slot) => (
                  <SlotRow
                    key={slot.id}
                    slot={slot}
                    onPick={() => {
                      setDaySlots(null);
                      setPickerSlot(slot);
                    }}
                    reduceMotion={Boolean(reduceMotion)}
                  />
                ))}
              </ul>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SlotRow({
  slot,
  showCountdown = false,
  onPick,
  reduceMotion,
}: {
  slot: CalendarSlot;
  showCountdown?: boolean;
  onPick: () => void;
  reduceMotion: boolean;
}) {
  const adventure = slot.adventureId ? getAdventure(slot.adventureId) : null;
  const budget = slotBudget(slot);
  const meta = TIER_META[slot.tier];

  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-card overflow-hidden rounded-xl border",
        slot.tier === "green" && "border-l-tier-green border-l-3",
        slot.tier === "amber" && "border-l-tier-amber border-l-3",
        slot.tier === "red" && "border-l-tier-red border-l-3",
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-medium">{formatSlotDate(slot.date)}</span>
            <span className="text-muted-foreground text-xs">
              {meta.label} · {money(budget)}
              {showCountdown && ` · ${formatCountdown(slot.date)}`}
            </span>
          </div>

          {adventure ? (
            <Link
              href={`/adventure/${adventure.id}`}
              className="focus-visible:outline-ring mt-1.5 block rounded focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <div className="flex items-center gap-2">
                <RefTag refCode={adventure.ref} />
                <span className="text-muted-foreground text-xs">
                  {nightsLabel(adventure.nights)}
                </span>
              </div>
              <p className="text-sm leading-snug font-medium">{adventure.title}</p>
              <p className="text-muted-foreground truncate text-xs">
                {adventure.location}
              </p>
            </Link>
          ) : (
            <p className="text-muted-foreground mt-1 text-sm">
              Nothing booked — {meta.description}
            </p>
          )}
        </div>

        <Button
          type="button"
          variant={adventure ? "ghost" : "outline"}
          size="sm"
          onClick={onPick}
          aria-label={
            adventure
              ? `Change the adventure booked for ${formatSlotDate(slot.date)}`
              : `Choose an adventure for ${formatSlotDate(slot.date)}`
          }
        >
          {adventure ? (
            "Change"
          ) : (
            <>
              <PlusIcon className="size-4" />
              Fill
            </>
          )}
        </Button>
      </div>
    </motion.li>
  );
}
