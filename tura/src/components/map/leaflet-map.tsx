"use client";

import * as React from "react";
import type { Map as LeafletMapInstance, Marker, TileLayer } from "leaflet";

import { ADVENTURES } from "@/lib/adventures";
import type { Adventure, MapStyleId, Status } from "@/lib/types";
import { MAP_STYLES } from "./map-styles";

export interface LeafletMapProps {
  styleId: MapStyleId;
  /** The adventure the map is currently centred on. */
  focusId: string | null;
  /** Which adventures to plot. Defaults to the whole catalogue. */
  adventures?: Adventure[];
  /** Drives the pin colour so the map doubles as a status view. */
  statusFor?: (adventureId: string) => Status;
  onSelect?: (adventureId: string) => void;
  /** Zoom used when flying to a focused adventure. */
  focusZoom?: number;
  interactive?: boolean;
  /** Accessible name, used only when the map is interactive. */
  label?: string;
  className?: string;
}

const TIER_ATTENTION: Record<string, string> = {
  completed: "var(--tier-green)",
  booked: "var(--tier-amber)",
  planned: "var(--water)",
  shortlisted: "var(--fern)",
  skipped: "var(--granite)",
  idea: "var(--granite)",
};

/** A pin drawn in CSS so it inherits the theme instead of shipping images. */
function pinHtml(status: Status, focused: boolean): string {
  const colour = TIER_ATTENTION[status] ?? "var(--granite)";
  const size = focused ? 20 : 13;
  const ring = focused ? 4 : 2;
  return `
    <span style="
      display:block;
      width:${size}px;height:${size}px;
      border-radius:9999px;
      background:${colour};
      border:${ring}px solid rgb(var(--scrim) / 0.85);
      box-shadow:0 2px 10px rgb(0 0 0 / 0.5);
      transition:width .2s, height .2s;
    "></span>`;
}

/**
 * The scrolling backdrop map.
 *
 * Leaflet is imported at run time only — it touches `window` on import, so it
 * cannot be part of the server bundle.
 */
export default function LeafletMap({
  styleId,
  focusId,
  adventures = ADVENTURES,
  statusFor,
  onSelect,
  focusZoom = 10,
  interactive = true,
  label,
  className,
}: LeafletMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMapInstance | null>(null);
  const layerRef = React.useRef<TileLayer | null>(null);
  const markersRef = React.useRef(new Map<string, Marker>());
  const leafletRef = React.useRef<typeof import("leaflet") | null>(null);
  const [ready, setReady] = React.useState(false);

  // Latest callback, so re-creating markers is not tied to render identity.
  const onSelectRef = React.useRef(onSelect);
  React.useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  React.useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        center: [54.5, -3.5],
        zoom: 6,
        zoomControl: false,
        attributionControl: true,
        // The page scrolls; the map must not steal the gesture.
        scrollWheelZoom: interactive,
        dragging: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: false,
        keyboard: interactive,
        preferCanvas: true,
      });

      if (interactive) {
        L.control.zoom({ position: "bottomright" }).addTo(map);
      }

      mapRef.current = map;
      setReady(true);
    })();

    const markers = markersRef.current;
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      markers.clear();
      setReady(false);
    };
  }, [interactive]);

  // Tile layer, swapped when the couple changes map style.
  React.useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !ready) return;

    const style = MAP_STYLES[styleId];
    const layer = L.tileLayer(style.url, {
      attribution: style.attribution,
      maxZoom: style.maxZoom,
      // Keeps the map readable while panning over patchy mobile data.
      keepBuffer: 3,
      crossOrigin: true,
    });

    layer.addTo(map);
    const previous = layerRef.current;
    layerRef.current = layer;
    // Remove the old layer only once the new one has drawn, so the map never
    // flashes the empty background colour.
    layer.once("load", () => previous?.remove());
    const timeout = window.setTimeout(() => previous?.remove(), 2500);

    return () => window.clearTimeout(timeout);
  }, [styleId, ready]);

  // Markers.
  React.useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !ready) return;

    const markers = markersRef.current;
    for (const marker of markers.values()) marker.remove();
    markers.clear();

    for (const adventure of adventures) {
      const status = statusFor?.(adventure.id) ?? "idea";
      const marker = L.marker([adventure.coords.lat, adventure.coords.lng], {
        icon: L.divIcon({
          html: pinHtml(status, adventure.id === focusId),
          className: "tura-pin",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
        keyboard: false,
        title: `${adventure.ref} — ${adventure.title}`,
        alt: `${adventure.title}, ${adventure.location}`,
      });

      marker.on("click", () => onSelectRef.current?.(adventure.id));
      marker.addTo(map);
      markers.set(adventure.id, marker);
    }

    return () => {
      for (const marker of markers.values()) marker.remove();
      markers.clear();
    };
  }, [adventures, statusFor, focusId, ready]);

  // Fly to the adventure currently in view.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !focusId) return;

    const adventure = adventures.find((a) => a.id === focusId);
    if (!adventure) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const target: [number, number] = [adventure.coords.lat, adventure.coords.lng];

    if (reduceMotion) {
      map.setView(target, focusZoom, { animate: false });
    } else {
      map.flyTo(target, focusZoom, { duration: 1.4, easeLinearity: 0.22 });
    }
  }, [focusId, adventures, focusZoom, ready]);

  // The map lives behind a scrolling page, so it must re-measure on rotate.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const observer = new ResizeObserver(() => map.invalidateSize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <div
      ref={containerRef}
      className={className}
      // As a scrolling backdrop the map is decoration — the list beside it is
      // the accessible interface. When it is interactive it holds focusable
      // controls, so it must be exposed and named instead of hidden.
      {...(interactive
        ? { role: "application", "aria-label": label ?? "Map" }
        : { role: "presentation", "aria-hidden": true })}
    />
  );
}
