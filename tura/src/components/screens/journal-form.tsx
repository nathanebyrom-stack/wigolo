"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  CameraPlusIcon,
  FloppyDiskIcon,
  XIcon,
} from "@phosphor-icons/react/ssr";
import { toast } from "sonner";

import { RatingInput } from "@/components/journal/rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ADVENTURES, getAdventure } from "@/lib/adventures";
import { toISODate } from "@/lib/calendar";
import { fileToStoredPhoto, MAX_PHOTOS_PER_ENTRY } from "@/lib/images";
import { useStore } from "@/lib/store";
import type { JournalEntry } from "@/lib/types";

export function JournalFormScreen() {
  const params = useSearchParams();
  const { state, hydrated } = useStore();

  const entryId = params.get("entry");
  const existing = entryId
    ? state.journal.find((entry) => entry.id === entryId)
    : undefined;

  // Nothing can be pre-filled until LocalStorage has been read.
  if (!hydrated) return <FormSkeleton />;

  if (entryId && !existing) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
          <Link href="/journal">
            <ArrowLeftIcon className="size-4" />
            Journal
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Entry not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          That journal entry has been deleted. Nothing was lost from anything
          else.
        </p>
        <Button asChild className="mt-4">
          <Link href="/journal/new">Start a new entry</Link>
        </Button>
      </div>
    );
  }

  // Keyed so switching between entries starts from that entry's values rather
  // than carrying the previous form state over.
  return (
    <JournalForm
      key={existing?.id ?? "new"}
      existing={existing}
      defaultAdventureId={params.get("adventure") ?? ""}
    />
  );
}

function FormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5" aria-busy="true">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function JournalForm({
  existing,
  defaultAdventureId,
}: {
  existing?: JournalEntry;
  defaultAdventureId: string;
}) {
  const router = useRouter();
  const { state, addJournalEntry, updateJournalEntry, setStatus } = useStore();

  const [adventureId, setAdventureId] = React.useState(
    existing?.adventureId ?? defaultAdventureId,
  );
  const [date, setDate] = React.useState(existing?.date ?? toISODate(new Date()));
  const [title, setTitle] = React.useState(existing?.title ?? "");
  const [body, setBody] = React.useState(existing?.body ?? "");
  const [standout, setStandout] = React.useState(existing?.standout ?? "");
  const [weather, setWeather] = React.useState(existing?.weather ?? "");
  const [rating, setRating] = React.useState(existing?.rating ?? 0);
  const [photos, setPhotos] = React.useState<string[]>(existing?.photos ?? []);
  const [busy, setBusy] = React.useState(false);

  const adventure = adventureId ? getAdventure(adventureId) : undefined;
  const valid = Boolean(adventureId) && title.trim().length > 0 && body.trim().length > 0;

  const options = React.useMemo(
    () =>
      [...ADVENTURES].sort((a, b) => {
        const aDone = state.records[a.id]?.status === "completed";
        const bDone = state.records[b.id]?.status === "completed";
        if (aDone !== bDone) return aDone ? -1 : 1;
        return a.ref.localeCompare(b.ref);
      }),
    [state.records],
  );

  async function handlePhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);

    const room = MAX_PHOTOS_PER_ENTRY - photos.length;
    if (room <= 0) {
      toast.error(`An entry holds at most ${MAX_PHOTOS_PER_ENTRY} photos.`);
      setBusy(false);
      return;
    }

    const added: string[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      try {
        added.push(await fileToStoredPhoto(file));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "That photo could not be added.",
        );
      }
    }

    if (added.length > 0) setPhotos((prev) => [...prev, ...added]);
    setBusy(false);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid) return;

    const payload = {
      adventureId,
      date,
      title: title.trim(),
      body: body.trim(),
      standout: standout.trim(),
      weather: weather.trim(),
      rating,
      photos,
    };

    if (existing) {
      updateJournalEntry(existing.id, payload);
      toast.success("Entry updated");
    } else {
      addJournalEntry(payload);
      // Writing it up is the strongest signal an adventure actually happened.
      if (state.records[adventureId]?.status !== "completed") {
        setStatus(adventureId, "completed");
      }
      toast.success("Written up — and marked completed");
    }

    router.push("/journal");
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/journal">
          <ArrowLeftIcon className="size-4" />
          Journal
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">
        {existing ? "Edit entry" : "Write it up"}
      </h1>
      <p className="text-muted-foreground mt-1 mb-5 text-sm">
        {existing
          ? "Changes save when you press the button."
          : "Saving this marks the adventure completed."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="entry-adventure">Which adventure?</Label>
          <Select value={adventureId} onValueChange={setAdventureId}>
            <SelectTrigger id="entry-adventure">
              <SelectValue placeholder="Choose from the catalogue" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.ref} — {option.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {adventure && (
            <p className="text-muted-foreground text-xs">
              {adventure.location}, {adventure.country}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="entry-date">When</Label>
            <Input
              id="entry-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-weather">Conditions</Label>
            <Input
              id="entry-weather"
              value={weather}
              onChange={(event) => setWeather(event.target.value)}
              placeholder="Rain, then a clear dusk"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry-title">Title</Label>
          <Input
            id="entry-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="The night the tent nearly went"
            required
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry-body">How it went</Label>
          <Textarea
            id="entry-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Left at four, hit the valley by seven. Wind got up around midnight..."
            rows={8}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry-standout">The line worth keeping</Label>
          <Input
            id="entry-standout"
            value={standout}
            onChange={(event) => setStandout(event.target.value)}
            placeholder="Neither of us said anything for the last mile."
            autoComplete="off"
          />
          <p className="text-muted-foreground text-xs">
            Pulled out and set in type in the adventure book.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">Worth doing again?</legend>
          <RatingInput value={rating} onChange={setRating} />
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="entry-photos">Photographs</Label>
          <input
            id="entry-photos"
            type="file"
            accept="image/*"
            multiple
            disabled={busy || photos.length >= MAX_PHOTOS_PER_ENTRY}
            onChange={(event) => {
              void handlePhotos(event.target.files);
              event.target.value = "";
            }}
            className="sr-only"
          />
          <label
            htmlFor="entry-photos"
            className={`border-input bg-background/70 hover:bg-accent flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed text-sm transition-colors ${
              busy || photos.length >= MAX_PHOTOS_PER_ENTRY
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            <CameraPlusIcon className="size-4" />
            {busy
              ? "Resizing…"
              : photos.length >= MAX_PHOTOS_PER_ENTRY
                ? `Maximum ${MAX_PHOTOS_PER_ENTRY} photos`
                : "Add photos"}
          </label>
          <p className="text-muted-foreground text-xs">
            Resized to 1280px and stored on this device. {photos.length} of{" "}
            {MAX_PHOTOS_PER_ENTRY} used.
          </p>

          {photos.length > 0 && (
            <ul className="mt-2 grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <li key={photo.slice(-32)} className="relative">
                  <div className="relative aspect-square overflow-hidden rounded-lg border">
                    <Image
                      src={photo}
                      alt={`Photograph ${index + 1}`}
                      fill
                      unoptimized
                      sizes="33vw"
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPhotos((prev) => prev.filter((_, i) => i !== index))
                    }
                    aria-label={`Remove photograph ${index + 1}`}
                    className="bg-background/90 hover:text-destructive focus-visible:outline-ring absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border shadow-sm focus-visible:outline-2"
                  >
                    <XIcon className="size-3" weight="bold" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Button type="submit" disabled={!valid || busy} className="flex-1">
            <FloppyDiskIcon className="size-4" />
            {existing ? "Save changes" : "Save entry"}
          </Button>
          <Button asChild type="button" variant="ghost">
            <Link href="/journal">Cancel</Link>
          </Button>
        </div>

      </form>
    </div>
  );
}
