"use client";

import type { ReactNode } from "react";
import { useBudget } from "@/lib/budget/store";
import type { BudgetState } from "@/lib/budget/types";

/** Renders children once local data has loaded; shows a quiet skeleton before hydration. */
export function BudgetGate({ children }: { children: (state: BudgetState) => ReactNode }) {
  const state = useBudget();
  if (!state) {
    return (
      <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-6">
        <div className="h-4 w-32 rounded-full bg-line" />
        <div className="h-20 w-2/3 rounded-3xl bg-line" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-56 rounded-[28px] bg-line md:col-span-2" />
          <div className="h-56 rounded-[28px] bg-line" />
        </div>
      </div>
    );
  }
  return <>{children(state)}</>;
}
