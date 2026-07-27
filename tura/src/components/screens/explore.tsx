"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRightIcon,
  BinocularsIcon,
  CalendarBlankIcon,
  DiceFiveIcon,
  FunnelIcon,
  MapPinIcon,
} from "@phosphor-icons/react/ssr";

import { AdventureCard } from "@/components/adventure/adventure-card";
import { RefTag, TierBadge } from "@/components/adventure/badges";
import { CATEGORY_ICON } from "@/components/adventure/icons";
import { BleedMap } from "@/components/map/bleed-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADVENTURES, getAdventure } from "@/lib/adventures";
import { formatCountdown, formatSlotDate } from "@/lib/calendar";

import { useNextFifteen, usePlannedSlots, useStore } from "@/lib/store";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/types";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

type Scope = "all" | "uk" | "escapes" | "favourites";

const SCOPES: { id: Scope; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "uk", label: "UK only" },
  { id: "escapes", label: "Two-night escapes" },
  { id: "favourites", label: "Favourites" },
];

export function ExploreScreen() {
  const { state, hydrated } = useStore();
  const nextFifteen = useNextFifteen();
  const reduceMotion = useReducedMotion();

  const [focusId, setFocusId] = React.useState<string | null>(null);
  const [scope, setScope] = React.useState<Scope>("all");
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [query, setQuery] = React.useState("");
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const year = new Date().getFullYear();
  const planned = usePlannedSlots(year);
  const upcoming = React.useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    return planned.filter((p) => p.slot.date >= todayISO).slice(0, 1)[0] ?? null;
  }, [planned]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return ADVENTURES.filter((adventure) => {
      if (scope === "uk" && !adventure.uk) return false;
      if (scope === "escapes" && !(adventure.nights === 2 && adventure.adultsOnly)) {
        return false;
      }
      if (scope === "favourites" && !state.records[adventure.id]?.favourite) {
        return false;
      }
      if (
        categories.length > 0 &&
        !categories.some((c) => adventure.categories.includes(c))
      ) {
        return false;
      }
      if (needle) {
        const haystack =
          `${adventure.title} ${adventure.location} ${adventure.region} ${adventure.country} ${adventure.ref}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    }).sort((a, b) => b.popularity - a.popularity);
  }, [scope, categories, query, state.records]);

  // The map plots whatever the catalogue section is currently showing, so the
  // pins and the list never disagree.
  const plotted = React.useMemo(
    () => (filtered.length > 0 ? filtered : ADVENTURES),
    [filtered],
  );

  const focusZoom = React.useMemo(() => {
    const adventure = focusId ? getAdventure(focusId) : null;
    return adventure && !adventure.uk ? 8 : 10;
  }, [focusId]);

  const toggleCategory = (category: Category) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const activeFilters = categories.length + (scope === "all" ? 0 : 1);

  return (
    <>
      <BleedMap
        focusId={focusId}
        adventures={plotted}
        focusZoom={focusZoom}
        onSelect={setFocusId}
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-4">
        {/* Hero — deliberately short, so the map is visible immediately. */}
        <section className="pt-[calc(4.5rem+env(safe-area-inset-top,0px))] pb-6">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-primary text-xs font-medium tracking-[0.24em] uppercase">
              Two adults · no interruptions
            </p>
            <h1 className="mt-2 text-3xl leading-[1.1] font-semibold text-balance">
              Sixty-four ways to disappear for a weekend.
            </h1>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Three quarters of them within reach of a Friday evening. Half of
              them two nights long, with the phones off.
            </p>
          </motion.div>

          {hydrated && upcoming && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.45 }}
              className="mt-5"
            >
              <Link
                href="/calendar"
                className="bleed-panel focus-visible:outline-ring block rounded-xl border p-4 shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <div className="flex items-center gap-2">
                  <CalendarBlankIcon className="text-primary size-4" />
                  <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Next up · {formatCountdown(upcoming.slot.date)}
                  </span>
                </div>
                <p className="mt-2 font-display text-lg leading-tight font-semibold">
                  {upcoming.adventure.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RefTag refCode={upcoming.adventure.ref} />
                  <TierBadge tier={upcoming.slot.tier} showBudget />
                  <span className="text-muted-foreground text-xs">
                    {formatSlotDate(upcoming.slot.date)}
                  </span>
                </div>
              </Link>
            </motion.div>
          )}

          {hydrated && !upcoming && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/calendar">
                  <CalendarBlankIcon className="size-4" />
                  Fill the calendar
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/roulette">
                  <DiceFiveIcon className="size-4" />
                  Spin for one
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* A deliberate gap: nothing but map between the hero and the ranking. */}
        <div className="h-[35vh]" aria-hidden="true" />

        <section aria-labelledby="popular-heading" className="pb-8">
          <header className="bleed-panel-strong mb-4 rounded-xl border p-4 shadow-lg">
            <h2 id="popular-heading" className="text-xl font-semibold">
              The next fifteen
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Ranked by how often they get chosen. Anything you have finished or
              passed on drops off the list, and favourites float to the top.
            </p>
          </header>

          <ol className="space-y-3">
            {nextFifteen.map(({ adventure }, index) => (
              <li key={adventure.id}>
                <AdventureCard
                  adventure={adventure}
                  rank={index + 1}
                  onFocus={setFocusId}
                />
              </li>
            ))}
          </ol>

          {hydrated && nextFifteen.length === 0 && (
            <p className="bleed-panel rounded-xl border p-6 text-center text-sm">
              Every adventure in the catalogue is completed or skipped. That is
              genuinely impressive.
            </p>
          )}
        </section>

        <div className="h-[25vh]" aria-hidden="true" />

        <section aria-labelledby="catalogue-heading" className="pb-10">
          <header className="bleed-panel-strong mb-4 rounded-xl border p-4 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="catalogue-heading" className="text-xl font-semibold">
                  The whole catalogue
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {filtered.length} of {ADVENTURES.length}{" "}
                  {filtered.length === 1 ? "adventure" : "adventures"}
                </p>
              </div>
              <Button
                type="button"
                variant={activeFilters > 0 ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-controls="catalogue-filters"
              >
                <FunnelIcon className="size-4" />
                Filter
                {activeFilters > 0 && (
                  <span className="tabular">{activeFilters}</span>
                )}
              </Button>
            </div>

            <AnimatePresence initial={false}>
              {filtersOpen && (
                <motion.div
                  id="catalogue-filters"
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-4">
                    <div>
                      <label htmlFor="catalogue-search" className="sr-only">
                        Search adventures
                      </label>
                      <Input
                        id="catalogue-search"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by place, region or reference"
                      />
                    </div>

                    <fieldset>
                      <legend className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                        Scope
                      </legend>
                      <div className="flex flex-wrap gap-1.5">
                        {SCOPES.map((option) => (
                          <FilterChip
                            key={option.id}
                            pressed={scope === option.id}
                            onClick={() => setScope(option.id)}
                          >
                            {option.label}
                          </FilterChip>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset>
                      <legend className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                        Terrain
                      </legend>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map((category) => {
                          const Icon = CATEGORY_ICON[category];
                          return (
                            <FilterChip
                              key={category}
                              pressed={categories.includes(category)}
                              onClick={() => toggleCategory(category)}
                            >
                              <Icon className="size-3.5" />
                              {CATEGORY_LABEL[category]}
                            </FilterChip>
                          );
                        })}
                      </div>
                    </fieldset>

                    {(activeFilters > 0 || query) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setScope("all");
                          setCategories([]);
                          setQuery("");
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          {filtered.length === 0 ? (
            <div className="bleed-panel rounded-xl border p-6 text-center">
              <BinocularsIcon className="text-muted-foreground mx-auto size-8" />
              <p className="mt-3 text-sm font-medium">Nothing matches that</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Try widening the scope or dropping a terrain filter.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((adventure) => (
                <li key={adventure.id}>
                  <AdventureCard adventure={adventure} onFocus={setFocusId} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="pb-12">
          <div className="bleed-panel-strong rounded-xl border p-5 text-center shadow-lg">
            <MapPinIcon className="text-primary mx-auto size-6" />
            <h2 className="mt-2 text-lg font-semibold">Cannot decide?</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Let the roulette pick, and commit to whatever it lands on.
            </p>
            <Button asChild className="mt-4">
              <Link href="/roulette">
                <DiceFiveIcon className="size-4" />
                Open the roulette
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}

function FilterChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={pressed}>
      <Badge
        variant={pressed ? "default" : "outline"}
        className={cn(
          "cursor-pointer px-2.5 py-1 text-xs transition-colors",
          !pressed && "hover:bg-accent",
        )}
      >
        {children}
      </Badge>
    </button>
  );
}
