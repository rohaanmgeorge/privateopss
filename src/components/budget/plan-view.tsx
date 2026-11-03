"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { MonthSwitcher, PageHeader } from "@/components/shell/page-header";
import { useOS } from "@/components/shell/os-provider";
import { Money } from "@/components/ui/money";
import { Button, Eyebrow, Meter, Panel } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { money, parseAmount, percent } from "@/lib/budget/format";
import { monthlyTrend, spendByCategory, type CategorySpend } from "@/lib/budget/selectors";
import { budget } from "@/lib/budget/store";
import type { BudgetState, TransactionKind } from "@/lib/budget/types";
import { BudgetGate } from "./budget-gate";

const GLYPHS = ["◆", "◐", "→", "◇", "≋", "✺", "+", "⌂", "✦", "◎", "△", "☾", "♫", "✈", "☕", "✎"];
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];

export function PlanView() {
  return <BudgetGate>{(state) => <Plan state={state} />}</BudgetGate>;
}

function Plan({ state }: { state: BudgetState }) {
  const { month } = useOS();
  const [adding, setAdding] = useState(false);
  const cats = spendByCategory(state, month);
  const totalBudget = cats.reduce((s, c) => s + c.limit, 0);
  const trend = monthlyTrend(state, month, 3);
  const avgIncome = Math.round(trend.reduce((s, m) => s + m.income, 0) / trend.length);
  const unallocated = avgIncome - totalBudget;
  const incomeCats = state.categories.filter((c) => c.kind === "income");

  return (
    <>
      <PageHeader
        eyebrow="Plan · monthly envelopes"
        title={
          <>
            Give every amount <em>a job</em>.
          </>
        }
        actions={
          <>
            <MonthSwitcher locale={state.settings.locale} />
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus className="size-4" /> Category
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="p-6 md:p-8">
          <Eyebrow>Monthly plan</Eyebrow>
          <Money minor={totalBudget} settings={state.settings} className="mt-3 text-6xl" />
          <p className="mt-3 text-sm text-muted">across {cats.filter((c) => c.limit > 0).length} envelopes</p>
        </Panel>
        <Panel className="p-6 md:p-8">
          <Eyebrow>Average income · 3 mo</Eyebrow>
          <Money minor={avgIncome} settings={state.settings} className="mt-3 text-6xl text-positive" />
          <p className="mt-3 text-sm text-muted">{avgIncome ? `${percent(totalBudget / avgIncome)} of it is planned` : "No income recorded yet"}</p>
        </Panel>
        <Panel className={`p-6 md:p-8 ${unallocated >= 0 ? "bg-ink text-paper" : "bg-signal text-signal-ink"}`}>
          <Eyebrow className="!text-current opacity-60">{unallocated >= 0 ? "Unallocated" : "Over-planned"}</Eyebrow>
          <Money minor={Math.abs(unallocated)} settings={state.settings} className="mt-3 text-6xl [&_.text-muted]:text-current/60" />
          <p className="mt-3 text-sm opacity-70">{unallocated >= 0 ? "Room for savings or goals" : "Plan exceeds typical income"}</p>
        </Panel>
      </div>

      <AnimatePresence>{adding && <NewCategory onClose={() => setAdding(false)} />}</AnimatePresence>

      <Panel className="mt-4 divide-y divide-line">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_120px_40px] gap-6 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted md:grid">
          <span>Envelope</span>
          <span>Spent this month</span>
          <span>Progress</span>
          <span className="text-right">Monthly limit</span>
          <span />
        </div>
        {cats.map((c) => (
          <EnvelopeRow key={c.category.id} item={c} state={state} />
        ))}
      </Panel>

      {incomeCats.length > 0 && (
        <div className="mt-10">
          <Eyebrow className="px-2">Income sources</Eyebrow>
          <div className="mt-3 flex flex-wrap gap-2">
            {incomeCats.map((c) => (
              <IncomeChip key={c.id} id={c.id} name={c.name} glyph={c.glyph} color={c.color} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function EnvelopeRow({ item, state }: { item: CategorySpend; state: BudgetState }) {
  const toast = useToast();
  const { category, spent, limit, ratio, count } = item;
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? (limit ? String(limit / 100) : "");

  const save = () => {
    if (draft === null) return;
    const parsed = draft.trim() === "" ? 0 : parseAmount(draft);
    if (parsed === null) {
      setDraft(null);
      return;
    }
    if (parsed !== limit) {
      budget.upsertCategory({ ...category, monthlyLimit: parsed });
      toast.show(`${category.name} set to ${money(parsed, state.settings)}`);
    }
    setDraft(null);
  };

  const remove = () => {
    if (budget.removeCategory(category.id)) toast.show(`${category.name} removed`);
    else toast.show("Category has entries — reassign them first");
  };

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-5 md:grid-cols-[1.4fr_1fr_1fr_120px_40px] md:gap-6 md:px-8">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full border border-line" style={{ color: category.color }}>
          {category.glyph}
        </span>
        <div>
          <p className="font-medium">{category.name}</p>
          <p className="flex items-center gap-2 text-xs text-muted">
            {count} {count === 1 ? "entry" : "entries"}
            <button
              type="button"
              aria-pressed={!!category.fixed}
              title="Fixed costs are paid once a month and aren’t extrapolated in the forecast"
              onClick={() => budget.upsertCategory({ ...category, fixed: !category.fixed })}
              className={`rounded-full border px-1.5 font-mono text-[9px] uppercase tracking-wider transition ${
                category.fixed ? "border-ink bg-ink text-paper" : "border-line hover:border-line-strong"
              }`}
            >
              Fixed
            </button>
          </p>
        </div>
      </div>
      <p className="tabular hidden text-sm md:block">{money(spent, state.settings)}</p>
      <div className="col-span-2 flex items-center gap-3 md:col-span-1">
        <Meter ratio={ratio} color={category.color} />
        <span className={`tabular w-12 text-right text-xs ${ratio > 1 ? "font-medium text-signal" : "text-muted"}`}>
          {limit ? percent(ratio) : "—"}
        </span>
      </div>
      <label className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto">
        <span className="sr-only">Monthly limit for {category.name}</span>
        <input
          inputMode="decimal"
          value={value}
          placeholder="No limit"
          onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ""))}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setDraft(null);
          }}
          className="tabular h-10 w-28 rounded-xl border border-transparent bg-paper-2 px-3 text-right text-sm outline-none transition placeholder:text-muted hover:border-line focus:border-ink md:w-full"
        />
      </label>
      <button
        type="button"
        onClick={remove}
        aria-label={`Remove ${category.name}`}
        className="hidden size-9 place-items-center rounded-full text-muted transition hover:bg-negative/10 hover:text-negative md:grid"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function IncomeChip({ id, name, glyph, color }: { id: string; name: string; glyph: string; color: string }) {
  const toast = useToast();
  return (
    <span className="group inline-flex h-10 items-center gap-2 rounded-full border border-line pl-4 pr-2 text-sm">
      <span style={{ color }}>{glyph}</span>
      {name}
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={() => toast.show(budget.removeCategory(id) ? `${name} removed` : "Category has entries — reassign them first")}
        className="grid size-6 place-items-center rounded-full text-muted opacity-0 transition hover:text-negative group-hover:opacity-100 focus:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>
    </span>
  );
}

function NewCategory({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [glyph, setGlyph] = useState(GLYPHS[9]);
  const [color, setColor] = useState(COLORS[1]);
  const [kind, setKind] = useState<TransactionKind>("expense");
  const [limit, setLimit] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    budget.createCategory({
      name: name.trim(),
      glyph,
      color,
      kind,
      monthlyLimit: kind === "expense" ? (parseAmount(limit) ?? 0) : 0,
    });
    toast.show(`${name.trim()} created`);
    onClose();
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <Panel className="mt-4 grid gap-5 p-6 md:grid-cols-[1fr_auto] md:p-8">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              maxLength={28}
              className="display h-14 min-w-0 flex-1 border-b border-line bg-transparent text-4xl outline-none placeholder:text-line-strong focus:border-ink"
            />
            <div className="flex rounded-full border border-line p-1">
              {(["expense", "income"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`h-8 rounded-full px-3.5 text-sm capitalize ${kind === k ? "bg-ink text-paper" : "text-ink-2"}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GLYPHS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGlyph(g)}
                aria-pressed={glyph === g}
                className={`grid size-9 place-items-center rounded-full border text-sm transition ${glyph === g ? "border-ink bg-ink text-paper" : "border-line"}`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label="Colour"
                aria-pressed={color === c}
                className={`size-7 rounded-full ring-offset-2 ring-offset-card transition ${color === c ? "ring-2 ring-ink" : ""}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 md:w-56">
          {kind === "expense" && (
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Monthly limit</span>
              <input
                inputMode="decimal"
                value={limit}
                onChange={(e) => setLimit(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="Optional"
                className="tabular mt-2 h-11 w-full rounded-xl border border-line bg-transparent px-3 text-sm outline-none focus:border-ink"
              />
            </label>
          )}
          <div className="flex gap-2">
            <Button onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="signal" disabled={!name.trim()} className="flex-1">
              Create
            </Button>
          </div>
        </div>
      </Panel>
    </motion.form>
  );
}
