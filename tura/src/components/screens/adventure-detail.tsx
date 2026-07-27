"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftIcon,
  ArrowsClockwiseIcon,
  CalendarPlusIcon,
  HeartIcon,
  MapPinIcon,
  NotePencilIcon,
  SparkleIcon,
  TimerIcon,
} from "@phosphor-icons/react/ssr";
import { toast } from "sonner";

import {
  EscapeBadge,
  RefTag,
  TierBadge,
} from "@/components/adventure/badges";
import { CATEGORY_ICON } from "@/components/adventure/icons";
import { StatusPicker } from "@/components/adventure/status-picker";
import { SlotAssignSheet } from "@/components/calendar/slot-assign-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  buildChecklist,
  checklistProgress,
  CHECKLIST_GROUPS,
} from "@/lib/checklist";
import { formatSlotDate } from "@/lib/calendar";
import { distanceMiles, formatHours, formatMiles, money } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  CATEGORY_LABEL,
  DIFFICULTY_META,
  TIER_META,
} from "@/lib/types";
import type { Adventure } from "@/lib/types";
import { cn } from "@/lib/utils";

const LeafletMap = dynamic(() => import("@/components/map/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="from-pine to-slate-wet h-full w-full bg-gradient-to-b" />
  ),
});

const SEASON_LABEL = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
} as const;

export function AdventureDetail({ adventure }: { adventure: Adventure }) {
  const { state, recordFor, setStatus, toggleCheck, resetChecks, setNotes, toggleFavourite } =
    useStore();
  const record = recordFor(adventure.id);
  const reduceMotion = useReducedMotion();
  const [assignOpen, setAssignOpen] = React.useState(false);

  const checklist = React.useMemo(() => buildChecklist(adventure), [adventure]);
  const progress = checklistProgress(checklist, record.checked);
  const checkedSet = React.useMemo(() => new Set(record.checked), [record.checked]);

  const year = new Date().getFullYear();
  const bookedSlot = React.useMemo(
    () =>
      Object.values(state.slots).find((slot) => slot.adventureId === adventure.id),
    [state.slots, adventure.id],
  );

  const journalEntries = React.useMemo(
    () => state.journal.filter((entry) => entry.adventureId === adventure.id),
    [state.journal, adventure.id],
  );

  const miles = distanceMiles(state.settings.home, adventure.coords);

  return (
    <div className="mx-auto w-full max-w-2xl pb-4">
      <div className="mb-3 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">
            <ArrowLeftIcon className="size-4" />
            Explore
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => toggleFavourite(adventure.id)}
          aria-pressed={record.favourite}
          aria-label={
            record.favourite ? "Remove from favourites" : "Add to favourites"
          }
          className={record.favourite ? "text-rowan" : "text-muted-foreground"}
        >
          <HeartIcon
            className="size-5"
            weight={record.favourite ? "fill" : "regular"}
          />
        </Button>
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-4 h-56 overflow-hidden rounded-xl border shadow-lg">
          <LeafletMap
            styleId={state.settings.mapStyle}
            focusId={adventure.id}
            adventures={[adventure]}
            statusFor={() => record.status}
            focusZoom={adventure.uk ? 11 : 9}
            label={`Map of ${adventure.title}, ${adventure.location}`}
            interactive
            className="h-full w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <RefTag refCode={adventure.ref} />
          <span className="text-muted-foreground/50" aria-hidden="true">
            ·
          </span>
          <span className="text-muted-foreground text-xs">{adventure.region}</span>
        </div>

        <h1 className="mt-1.5 text-2xl leading-tight font-semibold text-balance">
          {adventure.title}
        </h1>

        <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
          <MapPinIcon className="size-4 shrink-0" />
          {adventure.location}, {adventure.country}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <TierBadge tier={adventure.tier} showBudget />
          <EscapeBadge nights={adventure.nights} adultsOnly={adventure.adultsOnly} />
        </div>

        <p className="mt-4 leading-relaxed">{adventure.summary}</p>
      </motion.div>

      <dl className="mt-5 grid grid-cols-2 gap-2">
        <Fact label="Typical cost" value={money(adventure.estimatedCost)} hint="for two" />
        <Fact
          label="Drive"
          value={formatHours(adventure.travelHours)}
          hint={`${formatMiles(miles)} as the crow flies`}
        />
        <Fact
          label="Difficulty"
          value={DIFFICULTY_META[adventure.difficulty].label}
          hint={DIFFICULTY_META[adventure.difficulty].description}
        />
        <Fact
          label="Best in"
          value={adventure.bestSeasons.map((s) => SEASON_LABEL[s]).join(", ")}
          hint={`Popularity ${adventure.popularity}/100`}
        />
      </dl>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {adventure.categories.map((category) => {
          const Icon = CATEGORY_ICON[category];
          return (
            <span
              key={category}
              className="border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
            >
              <Icon className="size-3.5" />
              {CATEGORY_LABEL[category]}
            </span>
          );
        })}
      </div>

      <Separator className="my-6" />

      <section aria-labelledby="status-heading">
        <h2 id="status-heading" className="mb-3 text-lg font-semibold">
          Where this stands
        </h2>
        <StatusPicker
          value={record.status}
          onChange={(status) => {
            setStatus(adventure.id, status);
            toast.success(`${adventure.ref} marked as ${status}`);
          }}
          label={`Status for ${adventure.title}`}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
            <CalendarPlusIcon className="size-4" />
            {bookedSlot ? "Move to another date" : "Put it in the calendar"}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/journal/new?adventure=${adventure.id}`}>
              <NotePencilIcon className="size-4" />
              Write it up
            </Link>
          </Button>
        </div>

        {bookedSlot && (
          <p className="text-muted-foreground mt-3 text-sm">
            Booked into the {TIER_META[bookedSlot.tier].label.toLowerCase()} slot on{" "}
            <Link href="/calendar" className="text-primary underline underline-offset-4">
              {formatSlotDate(bookedSlot.date)}
            </Link>
            .
          </p>
        )}

        {journalEntries.length > 0 && (
          <p className="text-muted-foreground mt-2 text-sm">
            {journalEntries.length}{" "}
            {journalEntries.length === 1 ? "entry" : "entries"} in the journal —{" "}
            <Link href="/journal" className="text-primary underline underline-offset-4">
              read them
            </Link>
            .
          </p>
        )}
      </section>

      <Separator className="my-6" />

      <section aria-labelledby="checklist-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="checklist-heading" className="text-lg font-semibold">
              Check-offs
            </h2>
            <p className="text-muted-foreground text-sm">
              {progress.done} of {progress.total} done
            </p>
          </div>
          {progress.done > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                resetChecks(adventure.id);
                toast(`Checklist for ${adventure.ref} reset`);
              }}
            >
              <ArrowsClockwiseIcon className="size-4" />
              Reset
            </Button>
          )}
        </div>

        <Progress
          value={progress.percent}
          className="mb-5 h-1.5"
          aria-label={`Preparation ${progress.percent} per cent complete`}
        />

        <div className="space-y-5">
          {CHECKLIST_GROUPS.map((group) => {
            const items = checklist.filter((item) => item.group === group.id);
            if (items.length === 0) return null;

            return (
              <fieldset key={group.id}>
                <legend className="mb-2">
                  <span className="text-sm font-semibold">{group.label}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {group.description}
                  </span>
                </legend>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const checked = checkedSet.has(item.id);
                    return (
                      <li key={item.id}>
                        <label
                          className={cn(
                            "hover:bg-accent/60 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition-colors",
                            checked && "opacity-55",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleCheck(adventure.id, item.id)}
                            className="mt-0.5"
                          />
                          <span
                            className={cn(
                              "text-sm leading-snug",
                              checked && "line-through",
                            )}
                          >
                            {item.label}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            );
          })}
        </div>
      </section>

      <Separator className="my-6" />

      <section aria-labelledby="highlights-heading">
        <h2 id="highlights-heading" className="mb-3 text-lg font-semibold">
          Why this one
        </h2>
        <ul className="space-y-2.5">
          {adventure.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-2.5">
              <SparkleIcon className="text-primary mt-0.5 size-4 shrink-0" />
              <span className="text-sm leading-relaxed">{highlight}</span>
            </li>
          ))}
        </ul>
      </section>

      <Separator className="my-6" />

      <section aria-labelledby="kit-heading">
        <h2 id="kit-heading" className="mb-3 text-lg font-semibold">
          Worth knowing
        </h2>
        <ul className="space-y-2.5">
          {adventure.kit.map((item) => (
            <li key={item} className="flex gap-2.5">
              <TimerIcon className="text-bracken mt-0.5 size-4 shrink-0" />
              <span className="text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <Separator className="my-6" />

      <section aria-labelledby="notes-heading">
        <h2 id="notes-heading" className="mb-1 text-lg font-semibold">
          Your notes
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Saved as you type, on this device only.
        </p>
        <Textarea
          id="adventure-notes"
          value={record.notes}
          onChange={(event) => setNotes(adventure.id, event.target.value)}
          placeholder="Pitch 14 is the flat one. Book the Thursday, drive up after work."
          aria-label={`Notes for ${adventure.title}`}
          rows={5}
        />
      </section>

      <SlotAssignSheet
        open={assignOpen}
        onOpenChange={setAssignOpen}
        adventureId={adventure.id}
        year={year}
      />
    </div>
  );
}

/**
 * One fact in the summary grid.
 *
 * Rendered as a single <div> holding its <dt>/<dd> pair, which is the only
 * wrapper a <dl> is allowed to contain.
 */
function Fact({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-card text-card-foreground rounded-xl border px-3.5 py-3 shadow-sm">
      <dt className="text-muted-foreground text-[0.6875rem] font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-tight font-semibold">{value}</dd>
      {hint && (
        <dd className="text-muted-foreground mt-0.5 text-xs leading-snug">
          {hint}
        </dd>
      )}
    </div>
  );
}
