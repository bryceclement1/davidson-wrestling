import { format } from "date-fns";

export function formatDate(value: string | Date, pattern = "MMM d, yyyy"): string {
  try {
    return format(new Date(value), pattern);
  } catch {
    // Always return a string fallback so React nodes remain valid
    return typeof value === "string" ? value : value.toISOString();
  }
}

export function formatPercentage(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function secondsToClock(seconds?: number) {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
