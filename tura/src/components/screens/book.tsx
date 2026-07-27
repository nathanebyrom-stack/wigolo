"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftIcon,
  BooksIcon,
  CaretLeftIcon,
  CaretRightIcon,
  MapPinIcon,
  QuotesIcon,
} from "@phosphor-icons/react/ssr";

import { RefTag, TierBadge } from "@/components/adventure/badges";
import { CATEGORY_ICON } from "@/components/adventure/icons";
import { RatingStars } from "@/components/journal/rating";
import { Button } from "@/components/ui/button";
import { getAdventure } from "@/lib/adventures";
import { formatShortDate } from "@/lib/calendar";
import { formatMiles, distanceMiles, money, nightsLabel } from "@/lib/format";
import { useStore } from "@/lib/store";
import { CATEGORY_LABEL } from "@/lib/types";
import type { Adventure, JournalEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Page {
  entry: JournalEntry;
  adventure: Adventure;
}

/**
 * The digital adventure book.
 *
 * One completed adventure per spread, turned by swipe, arrow keys or the
 * buttons. Built from journal entries, so it fills itself as the couple writes.
 */
export function BookScreen() {
  const { state, hydrated } = useStore();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(1);

  const pages = React.useMemo<Page[]>(() => {
    return [...state.journal]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => ({ entry, adventure: getAdventure(entry.adventureId) }))
      .filter((page): page is Page => Boolean(page.adventure));
  }, [state.journal]);

  const total = pages.length;
  const clamped = Math.min(index, Math.max(0, total - 1));

  const turn = React.useCallback(
    (delta: number) => {
      setDirection(delta);
      setIndex((current) => {
        const next = current + delta;
        if (next < 0 || next >= total) return current;
        return next;
      });
    },
    [total],
  );

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") turn(-1);
      if (event.key === "ArrowRight") turn(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn]);

  if (hydrated && total === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <BookHeader />
        <div className="bg-card mt-5 rounded-xl border p-8 text-center">
          <BooksIcon className="text-muted-foreground mx-auto size-10" />
          <h2 className="mt-4 text-lg font-semibold">The book is empty</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed">
            Every journal entry becomes a page here, with the photographs, the
            line worth keeping and the reference number. Write the first one and
            the book starts itself.
          </p>
          <Button asChild className="mt-5">
            <Link href="/journal/new">Write the first entry</Link>
          </Button>
        </div>
      </div>
    );
  }

  const page = pages[clamped];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <BookHeader />

      {page && (
        <>
          <div className="relative mt-4 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.article
                key={page.entry.id}
                custom={direction}
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, rotateY: direction > 0 ? 22 : -22, x: direction * 40 }
                }
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={
                  reduceMotion
                    ? undefined
                    : { opacity: 0, rotateY: direction > 0 ? -22 : 22, x: direction * -40 }
                }
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformPerspective: 1400 }}
                drag={reduceMotion ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.16}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -70) turn(1);
                  if (info.offset.x > 70) turn(-1);
                }}
                className="bg-card grain relative overflow-hidden rounded-xl border shadow-xl"
              >
                <BookPage page={page} number={clamped + 1} total={total} />
              </motion.article>
            </AnimatePresence>
          </div>

          <nav
            aria-label="Book pages"
            className="mt-4 flex items-center justify-between gap-3"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => turn(-1)}
              disabled={clamped === 0}
            >
              <CaretLeftIcon className="size-4" />
              Back
            </Button>

            <ol className="flex flex-1 items-center justify-center gap-1.5" aria-hidden="true">
              {pages.slice(0, 12).map((candidate, i) => (
                <li key={candidate.entry.id}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      setDirection(i > clamped ? 1 : -1);
                      setIndex(i);
                    }}
                    className={cn(
                      "block size-1.5 rounded-full transition-colors",
                      i === clamped ? "bg-primary" : "bg-border",
                    )}
                  />
                </li>
              ))}
              {total > 12 && (
                <li className="text-muted-foreground text-[0.6875rem]">
                  +{total - 12}
                </li>
              )}
            </ol>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => turn(1)}
              disabled={clamped >= total - 1}
            >
              Next
              <CaretRightIcon className="size-4" />
            </Button>
          </nav>

          <p className="text-muted-foreground mt-2 text-center text-xs" aria-live="polite">
            Page {clamped + 1} of {total}
            {!reduceMotion && " · swipe or use the arrow keys"}
          </p>
        </>
      )}
    </div>
  );
}

function BookHeader() {
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/journal">
          <ArrowLeftIcon className="size-4" />
          Journal
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold">The adventure book</h1>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
        Everything you have actually done, in the order it happened.
      </p>
    </div>
  );
}

function BookPage({
  page,
  number,
  total,
}: {
  page: Page;
  number: number;
  total: number;
}) {
  const { entry, adventure } = page;
  const { state } = useStore();
  const miles = distanceMiles(state.settings.home, adventure.coords);

  return (
    <>
      {entry.photos.length > 0 && (
        <div className="relative aspect-[3/2] w-full bg-black/25">
          <Image
            src={entry.photos[0]}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 672px) 100vw, 672px"
            className="object-cover"
            priority={number === 1}
          />
          <div className="from-card absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent" />
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <RefTag refCode={adventure.ref} />
          <span className="text-muted-foreground/50" aria-hidden="true">
            ·
          </span>
          <span className="text-muted-foreground text-xs">
            {formatShortDate(entry.date)}
          </span>
          <span className="ml-auto text-muted-foreground font-mono text-[0.6875rem] tabular">
            {number} / {total}
          </span>
        </div>

        <h2 className="font-display mt-2 text-2xl leading-tight font-semibold text-balance">
          {entry.title}
        </h2>

        <Link
          href={`/adventure/${adventure.id}`}
          className="text-muted-foreground hover:text-foreground focus-visible:outline-ring mt-1.5 flex items-center gap-1.5 text-sm underline-offset-4 transition-colors hover:underline focus-visible:outline-2"
        >
          <MapPinIcon className="size-4 shrink-0" />
          {adventure.title}
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <TierBadge tier={adventure.tier} />
          {entry.rating > 0 && <RatingStars value={entry.rating} />}
        </div>

        {entry.standout && (
          <figure className="border-primary/40 my-5 border-l-2 pl-4">
            <QuotesIcon className="text-primary/60 size-5" weight="fill" />
            <blockquote className="font-display mt-1.5 text-lg leading-snug italic">
              {entry.standout}
            </blockquote>
          </figure>
        )}

        <p className="mt-4 leading-relaxed whitespace-pre-line">{entry.body}</p>

        {entry.photos.length > 1 && (
          <ul className="mt-5 grid grid-cols-3 gap-2">
            {entry.photos.slice(1).map((photo, i) => (
              <li key={photo.slice(-32)} className="relative aspect-square overflow-hidden rounded-lg border">
                <Image
                  src={photo}
                  alt={`Photograph ${i + 2} from ${entry.title}`}
                  fill
                  unoptimized
                  sizes="33vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Where</dt>
            <dd className="font-medium">
              {adventure.location}, {adventure.country}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Distance from home</dt>
            <dd className="font-medium tabular">{formatMiles(miles)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Length</dt>
            <dd className="font-medium">
              {nightsLabel(adventure.nights)}
              {adventure.adultsOnly && ", uninterrupted"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Typical cost</dt>
            <dd className="font-medium tabular">
              {money(adventure.estimatedCost)}
            </dd>
          </div>
          {entry.weather && (
            <div className="col-span-2">
              <dt className="text-muted-foreground text-xs">Conditions</dt>
              <dd className="font-medium">{entry.weather}</dd>
            </div>
          )}
        </dl>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {adventure.categories.map((category) => {
            const Icon = CATEGORY_ICON[category];
            return (
              <li
                key={category}
                className="border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.6875rem]"
              >
                <Icon className="size-3" />
                {CATEGORY_LABEL[category]}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
