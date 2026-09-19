import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "fa 8 segons" / "fa 3 minuts" / "fa 2 hores" / falls back to a date. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((now.getTime() - then) / 1000));
  if (diffSec < 5) return "ara mateix";
  if (diffSec < 60) return `fa ${diffSec} segons`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `fa ${diffMin} minut${diffMin === 1 ? "" : "s"}`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `fa ${diffHour} hora${diffHour === 1 ? "" : "s"}`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `fa ${diffDay} dia${diffDay === 1 ? "" : "s"}`;
  return new Date(iso).toLocaleDateString("ca-ES");
}
