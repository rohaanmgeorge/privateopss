"use client";

import { Download, Search, X } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { MonthSwitcher, PageHeader } from "@/components/shell/page-header";
import { useOS } from "@/components/shell/os-provider";
import { Button, Eyebrow, Panel } from "@/components/ui/primitives";
import { monthLabel } from "@/lib/budget/dates";
import { money } from "@/lib/budget/format";
import { categoryMap, totals, txInMonth } from "@/lib/budget/selectors";
import type { BudgetState, Transaction, TransactionKind } from "@/lib/budget/types";
import { BudgetGate } from "./budget-gate";
import { EmptyMonth } from "./overview-view";
import { GroupedTransactions } from "./transaction-list";

export function TransactionsView() {
  return <BudgetGate>{(state) => <Transactions state={state} />}</BudgetGate>;
}

type KindFilter = "all" | TransactionKind;

function Transactions({ state }: { state: BudgetState }) {
  const { month, openComposer } = useOS();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [category, setCategory] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const cats = categoryMap(state);

  const monthList = txInMonth(state, month);
  const filtered = monthList.filter((t) => {
    if (kind !== "all" && t.kind !== kind) return false;
    if (category && t.categoryId !== category) return false;
    if (deferredQuery) {
      const hay = `${t.note} ${cats.get(t.categoryId)?.name ?? ""}`.toLowerCase();
      if (!hay.includes(deferredQuery)) return false;
    }
    return true;
  });
  const sum = totals(filtered);
  const usedCategories = state.categories.filter((c) => monthList.some((t) => t.categoryId === c.id));
  const filtering = kind !== "all" || category !== null || deferredQuery !== "";

  return (
    <>
      <PageHeader
        eyebrow={`Transactions · ${monthLabel(month, state.settings.locale)}`}
        title={
          <>
            Every <em>rupee</em>, accounted.
          </>
        }
        actions={
          <>
            <MonthSwitcher locale={state.settings.locale} />
            <Button onClick={() => downloadCSV(filtered, state, month)} disabled={!filtered.length}>
              <Download className="size-4" /> CSV
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel className="order-2 p-3 md:p-5 lg:order-1">
          <div className="flex flex-col gap-3 px-1 pb-4 md:flex-row md:items-center md:px-3">
            <label className="relative flex-1">
              <span className="sr-only">Search transactions</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes or categories"
                className="h-11 w-full rounded-full border border-line bg-transparent pl-11 pr-10 text-sm outline-none placeholder:text-muted focus:border-ink"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-ink"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </label>
            <div role="radiogroup" aria-label="Filter by type" className="flex rounded-full border border-line p-1">
              {(["all", "expense", "income"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => setKind(k)}
                  className={`h-8 rounded-full px-3.5 text-sm capitalize transition ${kind === k ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {usedCategories.length > 0 && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-2 pb-4 md:px-3">
              {usedCategories.map((c) => {
                const on = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCategory(on ? null : c.id)}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs transition ${
                      on ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-line-strong"
                    }`}
                  >
                    <span style={{ color: on ? undefined : c.color }}>{c.glyph}</span>
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}

          {filtered.length ? (
            <GroupedTransactions list={filtered} state={state} />
          ) : monthList.length ? (
            <div className="px-6 py-16 text-center">
              <p className="display text-3xl italic text-muted">Nothing matches.</p>
              <button
                type="button"
                className="mt-3 text-sm text-ink-2 underline underline-offset-4 hover:text-ink"
                onClick={() => {
                  setQuery("");
                  setKind("all");
                  setCategory(null);
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <EmptyMonth onAdd={() => openComposer()} />
          )}
        </Panel>

        <aside className="order-1 grid grid-cols-3 gap-3 lg:order-2 lg:sticky lg:top-10 lg:grid-cols-1 lg:self-start">
          <Summary label={filtering ? "Filtered in" : "In"} value={money(sum.income, state.settings)} tone="positive" />
          <Summary label={filtering ? "Filtered out" : "Out"} value={money(sum.expense, state.settings)} />
          <Summary label="Net" value={`${sum.net >= 0 ? "+" : "−"}${money(Math.abs(sum.net), state.settings)}`} dark />
          <p className="col-span-3 hidden px-2 text-xs text-muted lg:col-span-1 lg:block">
            {filtered.length} of {monthList.length} entries · click any row to edit
          </p>
        </aside>
      </div>
    </>
  );
}

function Summary({ label, value, tone, dark }: { label: string; value: string; tone?: "positive"; dark?: boolean }) {
  return (
    <Panel className={`p-4 md:p-6 ${dark ? "bg-ink text-paper" : ""}`}>
      <Eyebrow className={dark ? "!text-paper/50" : ""}>{label}</Eyebrow>
      <p className={`display tabular mt-2 text-xl md:mt-3 md:text-4xl ${tone === "positive" ? "text-positive" : ""}`}>{value}</p>
    </Panel>
  );
}

function downloadCSV(list: Transaction[], state: BudgetState, month: string) {
  const cats = categoryMap(state);
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [
    ["Date", "Type", "Category", "Note", "Amount", "Currency"].join(","),
    ...list.map((t) =>
      [t.date, t.kind, esc(cats.get(t.categoryId)?.name ?? ""), esc(t.note), (t.amount / 100).toFixed(2), state.settings.currency].join(","),
    ),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `private-os-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
