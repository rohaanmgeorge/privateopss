"use client";

import { AnimatePresence, motion } from "motion/react";
import { Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useOS } from "@/components/shell/os-provider";
import { Button, Kbd } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { today } from "@/lib/budget/dates";
import { money, parseAmount } from "@/lib/budget/format";
import { budget, useBudget } from "@/lib/budget/store";
import type { BudgetState, Transaction, TransactionKind } from "@/lib/budget/types";

export function Composer() {
  const { composer, closeComposer } = useOS();
  const state = useBudget();

  useEffect(() => {
    if (!composer.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeComposer();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [composer.open, closeComposer]);

  return (
    <AnimatePresence>
      {composer.open && state && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={closeComposer}
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={composer.editing ? "Edit entry" : "New entry"}
            className="relative w-full max-w-[560px] rounded-t-[32px] border border-line bg-card p-6 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.5)] md:rounded-[32px] md:p-8"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <ComposerForm key={composer.editing?.id ?? "new"} state={state} editing={composer.editing} onDone={closeComposer} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ComposerForm({ state, editing, onDone }: { state: BudgetState; editing: Transaction | null; onDone: () => void }) {
  const toast = useToast();
  const [kind, setKind] = useState<TransactionKind>(editing?.kind ?? "expense");
  const [amount, setAmount] = useState(editing ? String(editing.amount / 100) : "");
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [date, setDate] = useState(editing?.date ?? today());
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const categories = state.categories.filter((c) => c.kind === kind);
  const effectiveCategory = categories.some((c) => c.id === categoryId) ? categoryId : (categories[0]?.id ?? "");
  const parsed = parseAmount(amount);
  const valid = parsed !== null && effectiveCategory !== "";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const payload = { kind, amount: parsed, categoryId: effectiveCategory, note: note.trim(), date };
    if (editing) {
      budget.updateTransaction(editing.id, payload);
      toast.show("Entry updated");
    } else {
      budget.addTransaction(payload);
      toast.show(`${kind === "income" ? "Income" : "Expense"} of ${money(parsed, state.settings)} added`);
    }
    onDone();
  };

  const remove = () => {
    if (!editing) return;
    budget.removeTransaction(editing.id);
    toast.show("Entry deleted", { action: { label: "Undo", run: () => budget.restoreTransaction(editing) } });
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div role="radiogroup" aria-label="Type" className="relative flex rounded-full border border-line p-1">
          {(["expense", "income"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={`relative z-10 h-8 rounded-full px-4 text-sm capitalize transition ${kind === k ? "text-paper" : "text-ink-2"}`}
            >
              {kind === k && (
                <motion.span
                  layoutId="kind-pill"
                  className={`absolute inset-0 -z-10 rounded-full ${k === "expense" ? "bg-ink" : "bg-positive"}`}
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              {k}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onDone}
          aria-label="Close"
          className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-paper-2 hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>

      <label className="block">
        <span className="sr-only">Amount</span>
        <div className="flex items-baseline gap-2 border-b border-line pb-3 focus-within:border-ink">
          <span className="display text-4xl text-muted">
            {new Intl.NumberFormat(state.settings.locale, { style: "currency", currency: state.settings.currency })
              .formatToParts(0)
              .find((p) => p.type === "currency")?.value}
          </span>
          <input
            ref={amountRef}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            className="display tabular w-full bg-transparent text-[clamp(56px,12vw,88px)] outline-none placeholder:text-line-strong"
          />
        </div>
      </label>

      <fieldset>
        <legend className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Category</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = c.id === effectiveCategory;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                aria-pressed={on}
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition ${
                  on ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-line-strong"
                }`}
              >
                <span className="text-xs" style={{ color: on ? undefined : c.color }}>
                  {c.glyph}
                </span>
                {c.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <input
          placeholder="Add a note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={80}
          className="h-11 rounded-2xl border border-line bg-transparent px-4 text-sm outline-none placeholder:text-muted focus:border-ink"
        />
        <input
          type="date"
          value={date}
          max={today()}
          onChange={(e) => setDate(e.target.value || today())}
          className="h-11 rounded-2xl border border-line bg-transparent px-3 text-sm tabular outline-none focus:border-ink"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        {editing ? (
          <Button variant="danger" onClick={remove}>
            <Trash2 className="size-4" /> Delete
          </Button>
        ) : (
          <span className="hidden items-center gap-1.5 text-xs text-muted md:inline-flex">
            <Kbd>↵</Kbd> save · <Kbd>esc</Kbd> close
          </span>
        )}
        <Button type="submit" variant="signal" disabled={!valid} className="min-w-36">
          {editing ? "Save changes" : `Add ${kind}`}
        </Button>
      </div>
    </form>
  );
}
