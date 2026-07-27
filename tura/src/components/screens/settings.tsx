"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  DeviceMobileIcon,
  DownloadSimpleIcon,
  TrashIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react/ssr";
import { toast } from "sonner";

import { MAP_STYLE_LIST } from "@/components/map/map-styles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTH_NAMES } from "@/lib/calendar";
import { formatBytes } from "@/lib/storage";
import { parseState } from "@/lib/storage";
import { useStore } from "@/lib/store";
import type { MapStyleId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SettingsScreen() {
  const { state, updateSettings, resetAll, importState, footprint, hydrated } =
    useStore();
  const { theme, setTheme } = useTheme();
  const [confirmReset, setConfirmReset] = React.useState(false);
  const importRef = React.useRef<HTMLInputElement>(null);

  const settings = state.settings;

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tura-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }

  async function importData(file: File) {
    try {
      const text = await file.text();
      const parsed = parseState(text);
      importState(parsed);
      toast.success("Backup restored");
    } catch {
      toast.error("That file could not be read as a TURA backup.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Everything is kept on this device. Nothing is sent anywhere.
        </p>
      </header>

      <section aria-labelledby="who-heading" className="mb-6">
        <h2 id="who-heading" className="mb-3 text-lg font-semibold">
          The two of you
        </h2>
        <div className="bg-card space-y-4 rounded-xl border p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="partner-one">First name</Label>
              <Input
                id="partner-one"
                value={settings.partnerOne}
                onChange={(event) =>
                  updateSettings({ partnerOne: event.target.value })
                }
                placeholder="You"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-two">Second name</Label>
              <Input
                id="partner-two"
                value={settings.partnerTwo}
                onChange={(event) =>
                  updateSettings({ partnerTwo: event.target.value })
                }
                placeholder="Them"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthday">Birthday</Label>
            <Input
              id="birthday"
              type="date"
              value={settings.birthday}
              onChange={(event) =>
                updateSettings({ birthday: event.target.value })
              }
            />
            <p className="text-muted-foreground text-xs">
              The red adventure lands on the Saturday nearest this date, once a
              year.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="rhythm-heading" className="mb-6">
        <h2 id="rhythm-heading" className="mb-3 text-lg font-semibold">
          Calendar rhythm
        </h2>
        <div className="bg-card space-y-4 rounded-xl border p-4">
          <div className="space-y-2">
            <Label htmlFor="amber-anchor">Amber months start on</Label>
            <Select
              value={String(settings.amberAnchorMonth)}
              onValueChange={(value) =>
                updateSettings({ amberAnchorMonth: Number(value) })
              }
            >
              <SelectTrigger id="amber-anchor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.slice(0, 2).map((name, index) => (
                  <SelectItem key={name} value={String(index)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Amber runs every other month. Starting in January gives you
              January, March, May and so on; February shifts the whole rhythm.
            </p>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="home-label">Home</Label>
            <Input
              id="home-label"
              value={settings.homeLabel}
              onChange={(event) =>
                updateSettings({ homeLabel: event.target.value })
              }
              placeholder="Where you set off from"
              autoComplete="off"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="home-lat" className="text-xs font-normal">
                  Latitude
                </Label>
                <Input
                  id="home-lat"
                  type="number"
                  step="0.0001"
                  min="-90"
                  max="90"
                  value={settings.home.lat}
                  onChange={(event) => {
                    const lat = Number(event.target.value);
                    if (Number.isFinite(lat) && Math.abs(lat) <= 90) {
                      updateSettings({ home: { ...settings.home, lat } });
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="home-lng" className="text-xs font-normal">
                  Longitude
                </Label>
                <Input
                  id="home-lng"
                  type="number"
                  step="0.0001"
                  min="-180"
                  max="180"
                  value={settings.home.lng}
                  onChange={(event) => {
                    const lng = Number(event.target.value);
                    if (Number.isFinite(lng) && Math.abs(lng) <= 180) {
                      updateSettings({ home: { ...settings.home, lng } });
                    }
                  }}
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Used for the distance figures on every adventure and in the
              statistics.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="look-heading" className="mb-6">
        <h2 id="look-heading" className="mb-3 text-lg font-semibold">
          Look
        </h2>
        <div className="bg-card space-y-4 rounded-xl border p-4">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Theme</legend>
            <div role="radiogroup" aria-label="Theme" className="flex gap-1.5">
              {(["dark", "light", "system"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={theme === option}
                  onClick={() => {
                    setTheme(option);
                    updateSettings({ theme: option });
                  }}
                  className={cn(
                    "focus-visible:outline-ring flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                    theme === option
                      ? "border-primary bg-primary/10 text-foreground font-medium"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="border-t pt-4">
            <legend className="mb-2 text-sm font-medium">Map</legend>
            <div role="radiogroup" aria-label="Map style" className="space-y-1.5">
              {MAP_STYLE_LIST.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  role="radio"
                  aria-checked={settings.mapStyle === style.id}
                  onClick={() =>
                    updateSettings({ mapStyle: style.id as MapStyleId })
                  }
                  className={cn(
                    "focus-visible:outline-ring w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                    settings.mapStyle === style.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <p className="text-sm font-medium">{style.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {style.description}
                  </p>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <InstallSection />

      <section aria-labelledby="data-heading" className="mb-6">
        <h2 id="data-heading" className="mb-3 text-lg font-semibold">
          Your data
        </h2>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-sm">
            {hydrated
              ? `${formatBytes(footprint)} stored on this device.`
              : "Reading local storage…"}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Browsers give a site roughly 5 MB. Photographs are the only thing
            large enough to matter — export a backup before you clear the
            browser, and to move the plan to another phone.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={exportData}>
              <DownloadSimpleIcon className="size-4" />
              Export
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => importRef.current?.click()}
            >
              <UploadSimpleIcon className="size-4" />
              Import
            </Button>
          </div>

          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Choose a TURA backup file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importData(file);
              event.target.value = "";
            }}
          />

          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive mt-2 w-full"
            onClick={() => setConfirmReset(true)}
          >
            <TrashIcon className="size-4" />
            Erase everything
          </Button>
        </div>
      </section>

      <p className="text-muted-foreground pb-2 text-center text-xs">
        TURA · 64 adventures · 75% within the UK
      </p>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erase everything?</DialogTitle>
            <DialogDescription>
              Every status, check-off, calendar booking, expense and journal
              entry goes, along with any photographs. The catalogue itself stays.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
                toast("Everything erased");
              }}
            >
              Erase it all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Install guidance.
 *
 * Chrome and Edge fire `beforeinstallprompt`; iOS Safari never does, so it gets
 * the manual instructions instead of a button that would do nothing.
 */
function InstallSection() {
  const [prompt, setPrompt] = React.useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  // Display mode and user agent are browser state, not React state, so they are
  // read through useSyncExternalStore rather than set from an effect.
  const standalone = React.useSyncExternalStore(
    subscribeToDisplayMode,
    getStandalone,
    getStandaloneServer,
  );
  const iOS = React.useSyncExternalStore(noopSubscribe, getIsIOS, getIsIOSServer);

  React.useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    }
    function onInstalled() {
      setPrompt(null);
      setDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || dismissed) {
    return (
      <section aria-labelledby="install-heading" className="mb-6">
        <h2 id="install-heading" className="mb-3 text-lg font-semibold">
          On your home screen
        </h2>
        <p className="bg-card text-muted-foreground rounded-xl border p-4 text-sm leading-relaxed">
          TURA is installed. It works with no signal — the catalogue, your plan
          and the whole interface are cached on the device.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="install-heading" className="mb-6">
      <h2 id="install-heading" className="mb-3 text-lg font-semibold">
        Put it on your home screen
      </h2>
      <div className="bg-card rounded-xl border p-4">
        <DeviceMobileIcon className="text-primary size-5" />
        <p className="mt-2 text-sm leading-relaxed">
          Installed, TURA opens full-screen with no browser chrome and keeps
          working with no signal — which is the situation it is designed for.
        </p>

        {prompt ? (
          <Button
            type="button"
            className="mt-4 w-full"
            onClick={async () => {
              await prompt.prompt();
              const choice = await prompt.userChoice;
              if (choice.outcome === "accepted") setDismissed(true);
              setPrompt(null);
            }}
          >
            Install TURA
          </Button>
        ) : iOS ? (
          <ol className="text-muted-foreground mt-3 list-decimal space-y-1 pl-4 text-sm">
            <li>Tap the Share button in Safari.</li>
            <li>Scroll down and choose &ldquo;Add to Home Screen&rdquo;.</li>
            <li>Tap Add.</li>
          </ol>
        ) : (
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Use your browser&rsquo;s install or &ldquo;Add to Home Screen&rdquo;
            option. On iPhone this lives behind the Share button in Safari.
          </p>
        )}
      </div>
    </section>
  );
}

function subscribeToDisplayMode(listener: () => void): () => void {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function getStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches;
}

function getStandaloneServer(): boolean {
  return false;
}

function noopSubscribe(): () => void {
  return () => {};
}

function getIsIOS(): boolean {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !/crios|fxios/i.test(navigator.userAgent)
  );
}

function getIsIOSServer(): boolean {
  return false;
}
