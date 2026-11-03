"use client";

import { moneyParts } from "@/lib/budget/format";
import type { BudgetSettings } from "@/lib/budget/types";

/** Large display amount: serif whole part, small raised fraction. */
export function Money({
  minor,
  settings,
  className = "",
  sign = false,
}: {
  minor: number;
  settings: BudgetSettings;
  className?: string;
  sign?: boolean;
}) {
  const { whole, fraction } = moneyParts(Math.abs(minor), settings);
  const prefix = sign ? (minor < 0 ? "−" : "+") : minor < 0 ? "−" : "";
  return (
    <span className={`display tabular inline-flex items-start ${className}`}>
      {prefix && <span className="mr-[0.05em]">{prefix}</span>}
      <span>{whole}</span>
      <span className="ml-[0.04em] mt-[0.12em] text-[0.38em] leading-none text-muted">{fraction}</span>
    </span>
  );
}
