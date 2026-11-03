"use client";

import { motion } from "motion/react";
import { useOS } from "@/components/shell/os-provider";
import { relativeDay } from "@/lib/budget/dates";
import { money } from "@/lib/budget/format";
import { categoryMap, groupByDay } from "@/lib/budget/selectors";
import type { BudgetState, Transaction } from "@/lib/budget/types";

export function TransactionRow({ tx, state, index = 0 }: { tx: Transaction; state: BudgetState; index?: number }) {
  const { openComposer } = useOS();
  const cat = categoryMap(state).get(tx.categoryId);
  const income = tx.kind === "income";
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.02 }}
    >
      <button
        type="button"
        onClick={() => openComposer(tx)}
        className="group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition hover:bg-paper-2"
      >
        <span
          className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-base"
          style={{ color: cat?.color }}
          aria-hidden
        >
          {cat?.glyph ?? "·"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{tx.note || cat?.name || "Untitled"}</span>
          <span className="block truncate text-xs text-muted">{cat?.name}</span>
        </span>
        <span className={`tabular text-[15px] font-medium ${income ? "text-positive" : ""}`}>
          {income ? "+" : "−"}
          {money(tx.amount, state.settings)}
        </span>
      </button>
    </motion.li>
  );
}

export function GroupedTransactions({ list, state }: { list: Transaction[]; state: BudgetState }) {
  const groups = groupByDay(list);
  let i = 0;
  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <section key={g.date}>
          <header className="sticky top-16 z-10 flex items-baseline justify-between border-b border-line bg-paper/85 px-3 py-2 backdrop-blur lg:top-0">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">{relativeDay(g.date, state.settings.locale)}</h3>
            <span className={`tabular text-xs ${g.net >= 0 ? "text-positive" : "text-muted"}`}>
              {g.net >= 0 ? "+" : "−"}
              {money(Math.abs(g.net), state.settings)}
            </span>
          </header>
          <ul className="mt-1">
            {g.items.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} state={state} index={i++} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
