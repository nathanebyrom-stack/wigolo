"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRightIcon,
  CalendarPlusIcon,
  DiceFiveIcon,
  ProhibitIcon,
  ShuffleIcon,
} from "@phosphor-icons/react/ssr";
import { toast } from "sonner";

import {
  EscapeBadge,
  RefTag,
  TierBadge,
} from "@/components/adventure/badges";
import { CATEGORY_ICON } from "@/components/adventure/icons";
import { SlotAssignSheet } from "@/components/calendar/slot-assign-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ADVENTURES, getAdventure } from "@/lib/adventures";
import { formatHours, money } from "@/lib/format";
import { useStore } from "@/lib/store";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/types";
import type { Adventure, Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const SPIN_MS = 1500;
const REEL_TICK_MS = 70;

export function RouletteScreen() {
  const { state, recordFor, recordSpin, hydrated } = useStore();
  const reduceMotion = useReducedMotion();

  const [ukOnly, setUkOnly] = React.useState(false);
  const [escapesOnly, setEscapesOnly] = React.useState(false);
  const [maxCost, setMaxCost] = React.useState(1500);
  const [maxDrive, setMaxDrive] = React.useState(13);
  const [categories, setCategories] = React.useState<Category[]>([]);

  const [spinning, setSpinning] = React.useState(false);
  const [reelId, setReelId] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<Adventure | null>(null);

  /**
   * The reel is a timer, not React state — it is cleared on unmount so a spin
   * in progress cannot keep ticking against a dead component.
   */
  const reel = React.useRef<{ interval: number | null; stop: number | null }>({
    interval: null,
    stop: null,
  });

  React.useEffect(() => {
    const timers = reel.current;
    return () => {
      if (timers.interval !== null) window.clearInterval(timers.interval);
      if (timers.stop !== null) window.clearTimeout(timers.stop);
    };
  }, []);

  const records = state.records;

  const pool = React.useMemo(() => {
    return ADVENTURES.filter((adventure) => {
      const status = records[adventure.id]?.status ?? "idea";
      if (status === "completed" || status === "skipped") return false;
      if (ukOnly && !adventure.uk) return false;
      if (escapesOnly && !(adventure.nights === 2 && adventure.adultsOnly)) {
        return false;
      }
      if (adventure.estimatedCost > maxCost) return false;
      if (adventure.travelHours > maxDrive) return false;
      if (
        categories.length > 0 &&
        !categories.some((c) => adventure.categories.includes(c))
      ) {
        return false;
      }
      return true;
    });
  }, [records, ukOnly, escapesOnly, maxCost, maxDrive, categories]);

  const spins = state.spins;
  const recentSpins = React.useMemo(
    () =>
      spins
        .slice(0, 5)
        .map((spin) => ({ spin, adventure: getAdventure(spin.adventureId) }))
        .filter(
          (row): row is { spin: (typeof spins)[number]; adventure: Adventure } =>
            Boolean(row.adventure),
        ),
    [spins],
  );

  const spin = React.useCallback(() => {
    if (pool.length === 0 || spinning) return;

    /**
     * Weighted by popularity so the roulette leans towards the good ones,
     * without ever excluding the obscure ones entirely.
     */
    const totalWeight = pool.reduce((sum, a) => sum + a.popularity, 0);
    let ticket = Math.random() * totalWeight;
    let chosen = pool[pool.length - 1];
    for (const adventure of pool) {
      ticket -= adventure.popularity;
      if (ticket <= 0) {
        chosen = adventure;
        break;
      }
    }

    if (reduceMotion || pool.length === 1) {
      setResult(chosen);
      setReelId(chosen.id);
      recordSpin(chosen.id);
      return;
    }

    setSpinning(true);
    setResult(null);

    const timers = reel.current;
    timers.interval = window.setInterval(() => {
      setReelId(pool[Math.floor(Math.random() * pool.length)].id);
    }, REEL_TICK_MS);

    timers.stop = window.setTimeout(() => {
      if (timers.interval !== null) window.clearInterval(timers.interval);
      timers.interval = null;
      timers.stop = null;
      setReelId(chosen.id);
      setResult(chosen);
      setSpinning(false);
      recordSpin(chosen.id);
    }, SPIN_MS);
  }, [pool, spinning, reduceMotion, recordSpin]);

  const reelAdventure = reelId ? getAdventure(reelId) : null;
  const shown = result ?? reelAdventure;

  const toggleCategory = (category: Category) =>
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">Adventure roulette</h1>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Set the limits, spin once, and go wherever it lands. Weighted towards
          the popular ones, but nothing is off the table.
        </p>
      </header>

      <section
        aria-labelledby="reel-heading"
        className="bg-card mb-5 overflow-hidden rounded-xl border"
      >
        <h2 id="reel-heading" className="sr-only">
          Result
        </h2>

        <div
          className="relative flex min-h-56 items-center justify-center p-5"
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatePresence mode="wait">
            {shown ? (
              <motion.div
                key={shown.id}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 1.02 }}
                transition={{ duration: spinning ? 0.05 : 0.35 }}
                className="w-full text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <RefTag refCode={shown.ref} />
                  <span className="text-muted-foreground text-xs">
                    {shown.region}
                  </span>
                </div>

                <p className="font-display mt-2 text-xl leading-tight font-semibold text-balance">
                  {shown.title}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {shown.location}, {shown.country}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                  <TierBadge tier={shown.tier} />
                  <EscapeBadge nights={shown.nights} adultsOnly={shown.adultsOnly} />
                </div>

                <div className="text-muted-foreground mt-3 flex items-center justify-center gap-4 text-xs">
                  <span className="tabular font-medium">
                    {money(shown.estimatedCost)}
                  </span>
                  <span>{formatHours(shown.travelHours)} away</span>
                  <span className="flex items-center gap-1">
                    {shown.categories.slice(0, 3).map((category) => {
                      const Icon = CATEGORY_ICON[category];
                      return (
                        <Icon
                          key={category}
                          className="size-4"
                          aria-label={CATEGORY_LABEL[category]}
                        />
                      );
                    })}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <DiceFiveIcon className="text-muted-foreground/50 mx-auto size-12" />
                <p className="text-muted-foreground mt-3 text-sm">
                  {pool.length} {pool.length === 1 ? "adventure" : "adventures"} in
                  the pool.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t p-4">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={spin}
            disabled={pool.length === 0 || spinning}
          >
            <ShuffleIcon
              className={cn("size-5", spinning && "animate-spin")}
              aria-hidden="true"
            />
            {spinning ? "Spinning" : result ? "Spin again" : "Spin"}
          </Button>

          {result && <ResultActions adventure={result} />}
        </div>
      </section>

      <section aria-labelledby="limits-heading" className="mb-5 space-y-5">
        <h2 id="limits-heading" className="text-lg font-semibold">
          Limits
        </h2>

        <div className="bg-card space-y-4 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="uk-only" className="flex-1">
              <span>
                UK only
                <span className="text-muted-foreground block text-xs font-normal">
                  Drive there, no flights
                </span>
              </span>
            </Label>
            <Switch id="uk-only" checked={ukOnly} onCheckedChange={setUkOnly} />
          </div>

          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <Label htmlFor="escapes-only" className="flex-1">
              <span>
                Two-night escapes only
                <span className="text-muted-foreground block text-xs font-normal">
                  Adults only, uninterrupted
                </span>
              </span>
            </Label>
            <Switch
              id="escapes-only"
              checked={escapesOnly}
              onCheckedChange={setEscapesOnly}
            />
          </div>

          <div className="border-t pt-4">
            <div className="mb-3 flex items-center justify-between">
              <Label htmlFor="max-cost">Spend no more than</Label>
              <span className="text-sm font-medium tabular">
                {maxCost >= 1500 ? "any" : money(maxCost)}
              </span>
            </div>
            <Slider
              id="max-cost"
              value={[maxCost]}
              onValueChange={([value]) => setMaxCost(value)}
              min={50}
              max={1500}
              step={50}
              aria-label="Maximum cost"
            />
          </div>

          <div className="border-t pt-4">
            <div className="mb-3 flex items-center justify-between">
              <Label htmlFor="max-drive">Travel no more than</Label>
              <span className="text-sm font-medium tabular">
                {maxDrive >= 13 ? "any" : formatHours(maxDrive)}
              </span>
            </div>
            <Slider
              id="max-drive"
              value={[maxDrive]}
              onValueChange={([value]) => setMaxDrive(value)}
              min={1}
              max={13}
              step={0.5}
              aria-label="Maximum travel time in hours"
            />
          </div>

          <fieldset className="border-t pt-4">
            <legend className="mb-2 text-sm font-medium">Terrain</legend>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((category) => {
                const Icon = CATEGORY_ICON[category];
                const pressed = categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => toggleCategory(category)}
                  >
                    <Badge
                      variant={pressed ? "default" : "outline"}
                      className={cn("cursor-pointer px-2.5 py-1", !pressed && "hover:bg-accent")}
                    >
                      <Icon className="size-3.5" />
                      {CATEGORY_LABEL[category]}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {pool.length === 0 && hydrated && (
          <p className="border-destructive/40 bg-destructive/10 flex items-start gap-2 rounded-lg border p-3 text-sm">
            <ProhibitIcon className="text-destructive mt-0.5 size-4 shrink-0" />
            Nothing matches those limits. Loosen one and the wheel will fill up
            again.
          </p>
        )}
      </section>

      {recentSpins.length > 0 && (
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-2 text-sm font-semibold">
            Recent spins
          </h2>
          <ul className="bg-card divide-y rounded-xl border">
            {recentSpins.map(({ spin: entry, adventure }, index) => (
              <li key={`${entry.at}-${index}`}>
                <Link
                  href={`/adventure/${adventure.id}`}
                  className="hover:bg-accent focus-visible:outline-ring flex items-center gap-3 px-3.5 py-2.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
                >
                  <RefTag refCode={adventure.ref} />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {adventure.title}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {recordFor(adventure.id).status === "idea"
                      ? "not taken"
                      : recordFor(adventure.id).status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ResultActions({ adventure }: { adventure: Adventure }) {
  const { setStatus, recordFor } = useStore();
  const [assignOpen, setAssignOpen] = React.useState(false);
  const record = recordFor(adventure.id);

  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setAssignOpen(true)}
        >
          <CalendarPlusIcon className="size-4" />
          Book it in
        </Button>
        <Button asChild variant="outline">
          <Link href={`/adventure/${adventure.id}`}>
            Read it
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
      </div>

      {record.status === "idea" && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 w-full"
          onClick={() => {
            setStatus(adventure.id, "shortlisted");
            toast.success(`${adventure.ref} shortlisted`);
          }}
        >
          Shortlist it for now
        </Button>
      )}

      <SlotAssignSheet
        open={assignOpen}
        onOpenChange={setAssignOpen}
        adventureId={adventure.id}
        year={new Date().getFullYear()}
      />
    </>
  );
}
