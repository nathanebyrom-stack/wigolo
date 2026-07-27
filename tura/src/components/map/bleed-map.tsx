"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { useStore } from "@/lib/store";
import type { Adventure, Status } from "@/lib/types";
import { cn } from "@/lib/utils";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => <MapFallback />,
});

function MapFallback() {
  return (
    <div
      aria-hidden="true"
      className="from-pine via-slate-wet to-background absolute inset-0 bg-gradient-to-b"
    />
  );
}

/**
 * The map that everything else scrolls over.
 *
 * It is fixed to the viewport at the bottom of the stacking order, so the
 * translucent panels above let the landscape bleed through as the page moves.
 */
export function BleedMap({
  focusId,
  adventures,
  onSelect,
  focusZoom,
  className,
}: {
  focusId: string | null;
  adventures?: Adventure[];
  onSelect?: (adventureId: string) => void;
  focusZoom?: number;
  className?: string;
}) {
  const { state } = useStore();

  const statusFor = React.useCallback(
    (adventureId: string): Status =>
      state.records[adventureId]?.status ?? "idea",
    [state.records],
  );

  return (
    <div
      className={cn(
        "tura-bleed-map pointer-events-none fixed inset-0 z-0 overflow-hidden",
        className,
      )}
    >
      <LeafletMap
        styleId={state.settings.mapStyle}
        focusId={focusId}
        adventures={adventures}
        statusFor={statusFor}
        onSelect={onSelect}
        focusZoom={focusZoom}
        interactive={false}
        className="pointer-events-auto absolute inset-0 h-full w-full"
      />
      {/* Darkens the top and bottom so the fixed bars stay legible over any tile. */}
      <div
        aria-hidden="true"
        className="from-background/80 pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b to-transparent"
      />
      <div
        aria-hidden="true"
        className="from-background/85 pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t to-transparent"
      />
    </div>
  );
}
