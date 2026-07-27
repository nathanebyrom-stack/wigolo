import type { Coordinates } from "./types";

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const GBP_PENCE = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** £320 — whole pounds, which is how budgets are actually discussed. */
export function money(amount: number): string {
  return GBP.format(Math.round(amount));
}

/** £32.50 — for individual expenses, where the pennies matter. */
export function moneyExact(amount: number): string {
  return GBP_PENCE.format(amount);
}

/** "2 nights", "1 night", "Day trip". */
export function nightsLabel(nights: number): string {
  if (nights === 0) return "Day trip";
  return nights === 1 ? "1 night" : `${nights} nights`;
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}

const EARTH_RADIUS_MILES = 3958.8;

/** Great-circle distance in miles. Straight line, not driving distance. */
export function distanceMiles(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

export function formatMiles(miles: number): string {
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles).toLocaleString("en-GB")} mi`;
}

/** "4h 30m" from a decimal hour count. */
export function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (minutes === 0) return `${whole}h`;
  return `${whole}h ${minutes}m`;
}

/** Compact number for stat tiles: 1.2k rather than 1,240. */
export function compact(value: number): string {
  if (Math.abs(value) < 1000) return String(Math.round(value));
  return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}
