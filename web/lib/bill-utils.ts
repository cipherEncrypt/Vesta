import type { Bill } from "@/lib/bills-types";
import { formatNearForRule } from "@/lib/save-usd";

export function clampDueDay(dueDay: number): number {
  return Math.min(31, Math.max(1, Math.floor(dueDay)));
}

/** Next calendar due date for a day-of-month (1–31). */
export function nextDueDate(dueDay: number, from = new Date()): Date {
  const day = clampDueDay(dueDay);
  const year = from.getFullYear();
  const month = from.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  let due = new Date(year, month, safeDay, 23, 59, 59);
  if (due.getTime() < from.getTime()) {
    const nextMonth = month + 1;
    const lastNext = new Date(year, nextMonth + 1, 0).getDate();
    const safeNext = Math.min(day, lastNext);
    due = new Date(year, nextMonth, safeNext, 23, 59, 59);
  }
  return due;
}

export function daysUntilDue(dueDay: number, from = new Date()): number {
  const due = nextDueDate(dueDay, from);
  return (due.getTime() - from.getTime()) / 86_400_000;
}

export function formatDueLabel(dueDay: number): string {
  const due = nextDueDate(dueDay);
  return due.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function usdToNearAmount(
  amountUsd: number,
  nearUsd: number | null,
): number | null {
  if (!nearUsd || nearUsd <= 0 || !Number.isFinite(amountUsd) || amountUsd <= 0) {
    return null;
  }
  return amountUsd / nearUsd;
}

export function formatBillNear(
  amountUsd: number,
  nearUsd: number | null,
): string | null {
  const near = usdToNearAmount(amountUsd, nearUsd);
  if (near == null) return null;
  return `≈ ${formatNearForRule(near)} NEAR`;
}

export function savingsUsd(
  savingsNear: number,
  nearUsd: number | null,
): number | null {
  if (!nearUsd || !Number.isFinite(savingsNear)) return null;
  return savingsNear * nearUsd;
}

export function isBillReady(savingsUsdValue: number, amountUsd: number): boolean {
  return savingsUsdValue >= amountUsd;
}

export function shouldAlertBill(ready: boolean, daysUntil: number): boolean {
  return ready || daysUntil <= 1;
}

export function billProgressLabel(
  savingsUsdValue: number,
  amountUsd: number,
  ready: boolean,
): string {
  const saved = Math.max(0, Math.min(savingsUsdValue, amountUsd));
  if (ready) {
    return `$${amountUsd.toFixed(2)} / $${amountUsd.toFixed(2)} · Ready to pay.`;
  }
  return `$${saved.toFixed(2)} / $${amountUsd.toFixed(2)} saved · saving…`;
}

export function sortBillsForDisplay(bills: Bill[]): Bill[] {
  return [...bills].sort(
    (a, b) => daysUntilDue(a.dueDay) - daysUntilDue(b.dueDay),
  );
}