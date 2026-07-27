"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { HeartIcon, MapPinIcon, TimerIcon } from "@phosphor-icons/react/ssr";

import { Progress } from "@/components/ui/progress";
import { buildChecklist, checklistProgress } from "@/lib/checklist";
import { formatHours, money } from "@/lib/format";
import { useStore } from "@/lib/store";
import { CATEGORY_LABEL } from "@/lib/types";
import type { Adventure } from "@/lib/types";
import { cn } from "@/lib/utils";

import { EscapeBadge, RefTag, StatusBadge, TierBadge } from "./badges";
import { CATEGORY_ICON } from "./icons";

/**
 * The catalogue card, used on the explore feed and every list in the app.
 *
 * The whole card is a link to the adventure; the favourite toggle is the one
 * nested control, so it stops the navigation itself.
 */
export function AdventureCard({
  adventure,
  rank,
  onFocus,
  className,
}: {
  adventure: Adventure;
  /** Position in the popularity ranking, shown when it is meaningful. */
  rank?: number;
  /** Called when the card scrolls into view, so the map can follow it. */
  onFocus?: (adventureId: string) => void;
  className?: string;
}) {
  const { recordFor, toggleFavourite } = useStore();
  const record = recordFor(adventure.id);
  const reduceMotion = useReducedMotion();

  const checklist = buildChecklist(adventure);
  const progress = checklistProgress(checklist, record.checked);
  const started = progress.done > 0;

  return (
    <motion.article
      onViewportEnter={onFocus ? () => onFocus(adventure.id) : undefined}
      viewport={{ margin: "-45% 0px -45% 0px" }}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative", className)}
    >
      <Link
        href={`/adventure/${adventure.id}`}
        className="bleed-panel focus-visible:outline-ring group block overflow-hidden rounded-xl border shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <div className="flex items-start gap-3 p-4">
          {rank !== undefined && (
            <span
              aria-hidden="true"
              className="font-display text-muted-foreground/60 w-7 shrink-0 pt-0.5 text-2xl leading-none font-semibold tabular"
            >
              {rank}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              <RefTag refCode={adventure.ref} />
              <span className="text-muted-foreground/50" aria-hidden="true">
                ·
              </span>
              <span className="text-muted-foreground truncate text-xs">
                {adventure.region}
              </span>
            </div>

            <h3 className="text-base leading-snug font-semibold text-balance">
              {adventure.title}
            </h3>

            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              <MapPinIcon className="size-3.5 shrink-0" />
              <span className="truncate">{adventure.location}</span>
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <TierBadge tier={adventure.tier} />
              <EscapeBadge
                nights={adventure.nights}
                adultsOnly={adventure.adultsOnly}
              />
              {record.status !== "idea" && <StatusBadge status={record.status} />}
            </div>

            <div className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
              <span className="tabular font-medium">
                {money(adventure.estimatedCost)}
              </span>
              <span className="flex items-center gap-1">
                <TimerIcon className="size-3.5" />
                {formatHours(adventure.travelHours)} away
              </span>
              <span className="ml-auto flex items-center gap-1">
                {adventure.categories.slice(0, 3).map((category) => {
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

            {started && (
              <div className="mt-3">
                <div className="text-muted-foreground mb-1 flex items-center justify-between text-[0.6875rem]">
                  <span>Preparation</span>
                  <span className="tabular">
                    {progress.done}/{progress.total}
                  </span>
                </div>
                <Progress
                  value={progress.percent}
                  className="h-1"
                  aria-label={`Preparation for ${adventure.title}: ${progress.percent} per cent complete`}
                />
              </div>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggleFavourite(adventure.id)}
        aria-pressed={record.favourite}
        aria-label={
          record.favourite
            ? `Remove ${adventure.title} from favourites`
            : `Add ${adventure.title} to favourites`
        }
        className={cn(
          "focus-visible:outline-ring absolute top-3 right-3 flex size-9 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
          record.favourite
            ? "text-rowan"
            : "text-muted-foreground/60 hover:text-foreground",
        )}
      >
        <HeartIcon
          className="size-5"
          weight={record.favourite ? "fill" : "regular"}
        />
      </button>
    </motion.article>
  );
}
