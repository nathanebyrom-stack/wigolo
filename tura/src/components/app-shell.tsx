"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  BookOpenTextIcon,
  CalendarBlankIcon,
  ChartLineUpIcon,
  CompassIcon,
  DiceFiveIcon,
  GearSixIcon,
  WalletIcon,
} from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

interface Tab {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; weight?: "regular" | "fill" }>;
}

const TABS: Tab[] = [
  { href: "/", label: "Explore", Icon: CompassIcon },
  { href: "/calendar", label: "Calendar", Icon: CalendarBlankIcon },
  { href: "/budget", label: "Budget", Icon: WalletIcon },
  { href: "/journal", label: "Journal", Icon: BookOpenTextIcon },
  { href: "/stats", label: "Stats", Icon: ChartLineUpIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { saveError } = useStore();

  // The explore screen owns the full-bleed map, so it opts out of the padding
  // and the solid background the other routes get.
  const isExplore = pathname === "/";

  return (
    <div className="relative flex min-h-dvh flex-col">
      <a
        href="#main"
        className="bg-primary text-primary-foreground focus:top-safe sr-only rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:z-100 focus:mt-2"
      >
        Skip to content
      </a>

      <TopBar />

      {saveError && <SaveWarning reason={saveError} />}

      <main
        id="main"
        className={cn(
          "relative flex-1",
          // Room for the fixed top bar and the tab bar, plus the home indicator.
          isExplore
            ? "pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]"
            : "px-4 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]",
        )}
      >
        {children}
      </main>

      <TabBar pathname={pathname} />
    </div>
  );
}

function TopBar() {
  const pathname = usePathname();
  const onRoulette = pathname === "/roulette";
  const onSettings = pathname === "/settings";

  return (
    <header className="bleed-panel pt-safe fixed inset-x-0 top-0 z-40 border-b">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-[0.2em] uppercase"
        >
          Tura
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/roulette"
            aria-label="Adventure roulette"
            aria-current={onRoulette ? "page" : undefined}
            className={cn(
              "hover:bg-accent focus-visible:outline-ring flex size-10 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
              onRoulette && "bg-accent text-primary",
            )}
          >
            <DiceFiveIcon className="size-5" weight={onRoulette ? "fill" : "regular"} />
          </Link>
          <Link
            href="/settings"
            aria-label="Settings"
            aria-current={onSettings ? "page" : undefined}
            className={cn(
              "hover:bg-accent focus-visible:outline-ring flex size-10 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
              onSettings && "bg-accent text-primary",
            )}
          >
            <GearSixIcon className="size-5" weight={onSettings ? "fill" : "regular"} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function TabBar({ pathname }: { pathname: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Primary"
      className="bleed-panel pb-safe fixed inset-x-0 bottom-0 z-40 border-t"
    >
      <ul className="mx-auto flex w-full max-w-2xl items-stretch justify-around px-1">
        {TABS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-visible:outline-ring relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg py-2 text-[0.6875rem] font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {active && !reduceMotion && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="bg-primary absolute top-0 h-0.5 w-8 rounded-full"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                {active && reduceMotion && (
                  <span className="bg-primary absolute top-0 h-0.5 w-8 rounded-full" />
                )}
                <Icon className="size-6" weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SaveWarning({ reason }: { reason: "quota" | "unavailable" }) {
  return (
    <AnimatePresence>
      <motion.div
        role="alert"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-destructive text-destructive-foreground fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-40 px-4 py-2 text-center text-xs font-medium"
      >
        {reason === "quota"
          ? "Storage is full — remove some journal photos or nothing new will save."
          : "This browser is blocking storage, so changes will not be kept."}
      </motion.div>
    </AnimatePresence>
  );
}
