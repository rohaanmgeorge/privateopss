"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { monthLabel, monthKey, today } from "@/lib/budget/dates";
import { Eyebrow } from "@/components/ui/primitives";
import { useOS } from "./os-provider";

export function PageHeader({ eyebrow, title, actions }: { eyebrow: string; title: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-6 pb-8 pt-2 md:flex-row md:items-end md:justify-between md:pb-12">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="display mt-3 text-[clamp(44px,7vw,92px)]">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function MonthSwitcher({ locale }: { locale: string }) {
  const { month, stepMonth, setMonth, isCurrentMonth } = useOS();
  return (
    <div className="flex items-center gap-1 rounded-full border border-line p-1">
      <button
        type="button"
        onClick={() => stepMonth(-1)}
        aria-label="Previous month"
        title="Previous month  ["
        className="grid size-8 place-items-center rounded-full text-ink-2 transition hover:bg-paper-2 hover:text-ink"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setMonth(monthKey(today()))}
        className="min-w-[132px] px-2 text-center text-sm font-medium tabular"
        title="Jump to this month"
      >
        {monthLabel(month, locale)}
      </button>
      <button
        type="button"
        onClick={() => stepMonth(1)}
        disabled={isCurrentMonth}
        aria-label="Next month"
        title="Next month  ]"
        className="grid size-8 place-items-center rounded-full text-ink-2 transition hover:bg-paper-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
