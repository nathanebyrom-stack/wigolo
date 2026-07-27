"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ChartLineUpIcon,
  FireIcon,
  GlobeHemisphereWestIcon,
  MoonIcon,
  PathIcon,
  StarIcon,
} from "@phosphor-icons/react/ssr";

import { TierDot } from "@/components/adventure/badges";
import { CATEGORY_ICON } from "@/components/adventure/icons";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { compact, money } from "@/lib/format";
import { computeStats } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { CATEGORY_LABEL, TIER_META } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatsScreen() {
  const { state, hydrated } = useStore();
  const reduceMotion = useReducedMotion();
  const year = new Date().getFullYear();

  const stats = React.useMemo(() => computeStats(state, year), [state, year]);

  const catalogueDone =
    stats.totalCatalogue === 0
      ? 0
      : Math.round((stats.completed / stats.totalCatalogue) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          What the two of you have actually done, rather than what you meant to.
        </p>
      </header>

      {hydrated && stats.completed === 0 ? (
        <div className="bg-card rounded-xl border p-6 text-center">
          <ChartLineUpIcon className="text-muted-foreground mx-auto size-8" />
          <p className="mt-3 text-sm font-medium">No numbers yet</p>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Mark an adventure completed, or write it up in the journal, and this
            page fills in.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/">Find one to do</Link>
          </Button>
        </div>
      ) : (
        <>
          <section aria-labelledby="headline-heading" className="mb-6">
            <h2 id="headline-heading" className="sr-only">
              Headline numbers
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <StatTile
                label="Adventures done"
                value={String(stats.completed)}
                hint={`of ${stats.totalCatalogue} in the catalogue`}
                Icon={PathIcon}
                reduceMotion={Boolean(reduceMotion)}
              />
              <StatTile
                label="Nights away"
                value={String(stats.nightsAway)}
                hint={`${stats.uninterruptedEscapes} uninterrupted`}
                Icon={MoonIcon}
                reduceMotion={Boolean(reduceMotion)}
              />
              <StatTile
                label="Miles covered"
                value={compact(stats.milesFromHome)}
                hint="there and back, straight line"
                Icon={GlobeHemisphereWestIcon}
                reduceMotion={Boolean(reduceMotion)}
              />
              <StatTile
                label="Best run"
                value={
                  stats.longestStreakMonths === 0
                    ? "—"
                    : `${stats.longestStreakMonths} mo`
                }
                hint="consecutive months out"
                Icon={FireIcon}
                reduceMotion={Boolean(reduceMotion)}
              />
            </div>
          </section>

          <section aria-labelledby="progress-heading" className="mb-6">
            <h2 id="progress-heading" className="mb-3 text-lg font-semibold">
              Through the catalogue
            </h2>
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm">Completed</span>
                <span className="text-sm font-semibold tabular">
                  {catalogueDone}%
                </span>
              </div>
              <Progress
                value={catalogueDone}
                className="mt-2 h-2"
                aria-label={`${catalogueDone} per cent of the catalogue completed`}
              />
              <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Shortlisted", value: stats.shortlisted },
                  { label: "Planned", value: stats.planned },
                  { label: "Booked", value: stats.booked },
                  { label: "Left", value: stats.remaining },
                ].map((row) => (
                  <div key={row.label}>
                    <dt className="text-muted-foreground text-[0.6875rem]">
                      {row.label}
                    </dt>
                    <dd className="text-lg font-semibold tabular">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section aria-labelledby="spend-heading" className="mb-6">
            <h2 id="spend-heading" className="mb-3 text-lg font-semibold">
              Spending in {year}
            </h2>
            <div className="bg-card rounded-xl border p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs">Planned</p>
                  <p className="text-xl font-semibold tabular">
                    {money(stats.plannedBudget)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Spent</p>
                  <p className="text-xl font-semibold tabular">
                    {money(stats.spentTotal)}
                  </p>
                </div>
              </div>
              <p
                className={cn(
                  "mt-3 text-sm",
                  stats.variance < 0
                    ? "text-destructive font-medium"
                    : "text-muted-foreground",
                )}
              >
                {stats.variance >= 0
                  ? `${money(stats.variance)} under the plan so far.`
                  : `${money(Math.abs(stats.variance))} over the plan so far.`}{" "}
                <Link
                  href="/budget"
                  className="text-primary underline underline-offset-4"
                >
                  Break it down
                </Link>
              </p>
            </div>
          </section>

          <section aria-labelledby="tier-heading" className="mb-6">
            <h2 id="tier-heading" className="mb-3 text-lg font-semibold">
              By tier
            </h2>
            <ul className="bg-card divide-y rounded-xl border">
              {stats.byTier.map((row) => (
                <li key={row.tier} className="flex items-center gap-3 px-4 py-3">
                  <TierDot tier={row.tier} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {TIER_META[row.tier].label}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {TIER_META[row.tier].cadence}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular">
                      {row.completed}
                    </p>
                    <p className="text-muted-foreground text-[0.6875rem]">
                      {row.planned} booked
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="terrain-heading" className="mb-6">
            <h2 id="terrain-heading" className="mb-3 text-lg font-semibold">
              Terrain covered
            </h2>
            <ul className="space-y-2">
              {stats.byCategory
                .slice()
                .sort((a, b) => b.completed - a.completed)
                .map((row) => {
                  const Icon = CATEGORY_ICON[row.category];
                  const percent =
                    row.total === 0
                      ? 0
                      : Math.round((row.completed / row.total) * 100);
                  return (
                    <li key={row.category} className="flex items-center gap-3">
                      <Icon className="text-muted-foreground size-4 shrink-0" />
                      <span className="w-28 shrink-0 text-sm">
                        {CATEGORY_LABEL[row.category]}
                      </span>
                      <Progress
                        value={percent}
                        className="h-1.5 flex-1"
                        aria-label={`${CATEGORY_LABEL[row.category]}: ${row.completed} of ${row.total}`}
                      />
                      <span className="text-muted-foreground w-10 shrink-0 text-right text-xs tabular">
                        {row.completed}/{row.total}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </section>

          <section aria-labelledby="reach-heading" className="mb-6">
            <h2 id="reach-heading" className="mb-3 text-lg font-semibold">
              How far you have got
            </h2>
            <div className="bg-card space-y-3 rounded-xl border p-4">
              <Row
                label="UK share of what you have done"
                value={`${stats.ukShare}%`}
              />
              <Row
                label="Countries"
                value={
                  stats.countriesVisited.length > 0
                    ? stats.countriesVisited.join(", ")
                    : "—"
                }
              />
              <Row
                label="Regions"
                value={String(stats.regionsVisited.length)}
              />
              <Row
                label="Journal entries"
                value={`${stats.journalEntries}${
                  stats.photos > 0 ? ` · ${stats.photos} photos` : ""
                }`}
              />
              {stats.averageRating !== null && (
                <Row
                  label="Average rating"
                  value={
                    <span className="flex items-center gap-1.5">
                      <StarIcon className="text-bracken size-3.5" weight="fill" />
                      {stats.averageRating.toFixed(1)} / 5
                    </span>
                  }
                />
              )}
            </div>
          </section>

          {stats.regionsVisited.length > 0 && (
            <section aria-labelledby="regions-heading">
              <h2 id="regions-heading" className="mb-2 text-sm font-semibold">
                Every region so far
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {stats.regionsVisited.map((region) => (
                  <li
                    key={region}
                    className="border-border text-muted-foreground rounded-full border px-2.5 py-1 text-xs"
                  >
                    {region}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  Icon,
  reduceMotion,
}: {
  label: string;
  value: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-card rounded-xl border p-4"
    >
      <Icon className="text-primary size-5" />
      <p className="mt-2 text-2xl leading-none font-semibold tabular">{value}</p>
      <p className="mt-1.5 text-sm font-medium">{label}</p>
      <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{hint}</p>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
