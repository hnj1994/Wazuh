import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AlertSeverity, IncidentStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function timeAgo(value: string | Date) {
  const date = new Date(value).getTime();
  const delta = Math.max(1, Math.round((Date.now() - date) / 1000));
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.round(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.round(delta / 3600)}h ago`;
  return `${Math.round(delta / 86400)}d ago`;
}

export function severityTone(severity: AlertSeverity) {
  const tones: Record<AlertSeverity, string> = {
    critical: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    high: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    low: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    informational: "border-slate-500/30 bg-slate-500/10 text-slate-300"
  };
  return tones[severity];
}

export function statusTone(status: IncidentStatus | string) {
  const tones: Record<string, string> = {
    new: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    triage: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    investigating: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    contained: "border-teal-500/30 bg-teal-500/10 text-teal-300",
    resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    closed: "border-slate-500/30 bg-slate-500/10 text-slate-300"
  };
  return tones[status] ?? tones.new;
}

export function riskTone(score: number) {
  if (score >= 90) return "text-rose-300";
  if (score >= 75) return "text-orange-300";
  if (score >= 50) return "text-amber-300";
  if (score >= 25) return "text-sky-300";
  return "text-emerald-300";
}

export function titleCase(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase());
}

export function truncateMiddle(value: string, max = 44) {
  if (value.length <= max) return value;
  const left = Math.ceil(max / 2) - 2;
  const right = Math.floor(max / 2) - 2;
  return `${value.slice(0, left)}...${value.slice(value.length - right)}`;
}
