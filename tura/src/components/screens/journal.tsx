"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  BooksIcon,
  NotePencilIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react/ssr";
import { toast } from "sonner";

import { RefTag } from "@/components/adventure/badges";
import { RatingStars } from "@/components/journal/rating";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAdventure } from "@/lib/adventures";
import { formatShortDate } from "@/lib/calendar";
import { useStore } from "@/lib/store";
import type { JournalEntry } from "@/lib/types";

export function JournalScreen() {
  const { state, deleteJournalEntry, hydrated } = useStore();
  const reduceMotion = useReducedMotion();
  const [pendingDelete, setPendingDelete] = React.useState<JournalEntry | null>(null);

  const byYear = React.useMemo(() => {
    const sorted = [...state.journal].sort((a, b) => b.date.localeCompare(a.date));
    const groups = new Map<string, JournalEntry[]>();
    for (const entry of sorted) {
      const year = entry.date.slice(0, 4);
      const list = groups.get(year);
      if (list) list.push(entry);
      else groups.set(year, [entry]);
    }
    return [...groups.entries()];
  }, [state.journal]);

  const photoCount = state.journal.reduce((sum, e) => sum + e.photos.length, 0);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">Journal</h1>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          What actually happened, written down before it blurs into the last one.
        </p>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <Button asChild>
          <Link href="/journal/new">
            <PlusIcon className="size-4" />
            New entry
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/book">
            <BooksIcon className="size-4" />
            The book
          </Link>
        </Button>
      </div>

      {hydrated && state.journal.length === 0 ? (
        <div className="bg-card rounded-xl border p-6 text-center">
          <NotePencilIcon className="text-muted-foreground mx-auto size-8" />
          <p className="mt-3 text-sm font-medium">Nothing written up yet</p>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            After the first trip, write it up the same evening. A paragraph and
            one photograph is enough.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {byYear.map(([year, entries]) => (
            <section key={year} aria-labelledby={`year-${year}`}>
              <div className="mb-3 flex items-baseline gap-3">
                <h2 id={`year-${year}`} className="text-lg font-semibold tabular">
                  {year}
                </h2>
                <span className="text-muted-foreground text-xs">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </span>
                <span className="bg-border h-px flex-1" />
              </div>

              <ul className="space-y-3">
                {entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    reduceMotion={Boolean(reduceMotion)}
                    onDelete={() => setPendingDelete(entry)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {state.journal.length > 0 && (
        <p className="text-muted-foreground mt-8 border-t pt-4 text-xs">
          {state.journal.length} {state.journal.length === 1 ? "entry" : "entries"}
          {photoCount > 0 && ` · ${photoCount} ${photoCount === 1 ? "photo" : "photos"}`}
          , stored on this device only.
        </p>
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this entry?</DialogTitle>
            <DialogDescription>
              {pendingDelete?.title} — written up on{" "}
              {pendingDelete && formatShortDate(pendingDelete.date)}. This cannot
              be undone, and any photographs in it go too.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingDelete(null)}
            >
              Keep it
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (pendingDelete) {
                  deleteJournalEntry(pendingDelete.id);
                  toast("Entry deleted");
                }
                setPendingDelete(null);
              }}
            >
              <TrashIcon className="size-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EntryCard({
  entry,
  reduceMotion,
  onDelete,
}: {
  entry: JournalEntry;
  reduceMotion: boolean;
  onDelete: () => void;
}) {
  const adventure = getAdventure(entry.adventureId);

  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card overflow-hidden rounded-xl border"
    >
      {entry.photos.length > 0 && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/20">
          <Image
            src={entry.photos[0]}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 672px) 100vw, 672px"
            className="object-cover"
          />
          {entry.photos.length > 1 && (
            <span className="bleed-panel absolute right-2 bottom-2 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium">
              +{entry.photos.length - 1}
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {adventure && <RefTag refCode={adventure.ref} />}
          <span className="text-muted-foreground text-xs">
            {formatShortDate(entry.date)}
          </span>
          {entry.rating > 0 && <RatingStars value={entry.rating} />}
        </div>

        <h3 className="mt-1.5 text-base leading-snug font-semibold">
          {entry.title}
        </h3>

        {adventure && (
          <Link
            href={`/adventure/${adventure.id}`}
            className="text-muted-foreground hover:text-foreground focus-visible:outline-ring mt-0.5 inline-block text-xs underline-offset-4 transition-colors hover:underline focus-visible:outline-2"
          >
            {adventure.title} · {adventure.location}
          </Link>
        )}

        {entry.standout && (
          <blockquote className="border-primary/40 text-foreground/90 mt-3 border-l-2 pl-3 text-sm italic">
            {entry.standout}
          </blockquote>
        )}

        <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">
          {entry.body}
        </p>

        {entry.weather && (
          <p className="text-muted-foreground mt-3 text-xs">
            Conditions: {entry.weather}
          </p>
        )}

        <div className="mt-4 flex gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/journal/new?entry=${entry.id}`}>
              <PencilSimpleIcon className="size-4" />
              Edit
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive"
          >
            <TrashIcon className="size-4" />
            Delete
          </Button>
        </div>
      </div>
    </motion.li>
  );
}
