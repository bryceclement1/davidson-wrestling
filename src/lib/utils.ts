import { format } from "date-fns";

export function formatDate(value: string | Date, pattern = "MMM d, yyyy") {
  try {
    return format(new Date(value), pattern);
  } catch {
    return value;
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
