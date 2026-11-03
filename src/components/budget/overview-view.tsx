"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Plus } from "lucide-react";
import { MonthSwitcher, PageHeader } from "@/components/shell/page-header";
import { useOS } from "@/components/shell/os-provider";
import { Money } from "@/components/ui/money";
import { Button, Eyebrow, Meter, Panel } from "@/components/ui/primitives";
import { monthLabel } from "@/lib/budget/dates";
import { money, percent } from "@/lib/budget/format";
import { dailyPace, forecast, monthlyTrend, spendByCategory, totals, txInMonth } from "@/lib/budget/selectors";
import type { BudgetState } from "@/lib/budget/types";
import { BudgetGate } from "./budget-gate";
import { CategoryRing, PaceChart, TrendBars } from "./charts";
import { TransactionRow } from "./transaction-list";

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } }),
};

export function OverviewView() {
  return <BudgetGate>{(state) => <Overview state={state} />}</BudgetGate>;
}

function Overview({ state }: { state: BudgetState }) {
  const { month, isCurrentMonth, openComposer } = useOS();
  const { settings } = state;
  const list = txInMonth(state, month);
  const t = totals(list);
  const cats = spendByCategory(state, month);
  const pace = dailyPace(state, month);
  const fc = forecast(state, month);
  const trend = monthlyTrend(state, month, 6);
  const remaining = fc.totalBudget - t.expense;
  const monthName = monthLabel(month, settings.locale).split(" ")[0];
  const overPace = isCurrentMonth && fc.projected > fc.totalBudget;

  return (
    <>
      <PageHeader
        eyebrow={`Budget · ${monthLabel(month, settings.locale)}`}
        title={
          <>
            Money, <em className="text-signal">quietly</em> in order.
          </>
        }
        actions={
          <>
            <MonthSwitcher locale={settings.locale} />
            <Button variant="primary" onClick={() => openComposer()} className="hidden md:inline-flex">
              <Plus className="size-4" /> New entry
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6 [&>*]:min-w-0">
        {/* Hero — remaining */}
        <motion.div custom={0} variants={rise} initial="hidden" animate="show" className="md:col-span-4">
          <Panel className="relative h-full overflow-hidden p-6 md:p-9">
            <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-signal/10 blur-3xl" />
            <Eyebrow>{remaining >= 0 ? `Left to spend in ${monthName}` : `Over budget in ${monthName}`}</Eyebrow>
            <Money
              minor={remaining}
              settings={settings}
              className={`mt-4 text-[clamp(64px,11vw,148px)] ${remaining < 0 ? "text-negative" : ""}`}
            />
            <div className="mt-8 max-w-xl">
              <Meter ratio={fc.totalBudget ? t.expense / fc.totalBudget : 0} />
              <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-ink-2">
                <span className="tabular">
                  {money(t.expense, settings)} <span className="text-muted">spent of</span> {money(fc.totalBudget, settings)}
                </span>
                {isCurrentMonth && fc.daysLeft > 0 && (
                  <span className="tabular text-muted">
                    {money(fc.safeDaily, settings)}/day for {fc.daysLeft} days
                  </span>
                )}
              </div>
            </div>
            {isCurrentMonth && (
              <p className="mt-8 max-w-md text-[15px] leading-relaxed text-ink-2">
                At this pace you’ll finish the month around{" "}
                <span className={`tabular font-medium ${overPace ? "text-signal" : "text-ink"}`}>{money(fc.projected, settings)}</span>
                {overPace ? " — a touch above plan." : " — comfortably inside the plan."}
              </p>
            )}
          </Panel>
        </motion.div>

        {/* Stat stack */}
        <motion.div custom={1} variants={rise} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-1">
          <Stat label="Income" value={money(t.income, settings)} tone="positive" />
          <Stat label="Spent" value={money(t.expense, settings)} />
          <Panel className="col-span-2 flex flex-col justify-between bg-ink p-6 text-paper md:col-span-1">
            <Eyebrow className="!text-paper/50">Savings rate</Eyebrow>
            <p className="display tabular mt-4 text-6xl">{t.income ? percent(Math.max(0, t.savingsRate)) : "—"}</p>
            <p className="mt-2 text-sm text-paper/60">
              {t.net >= 0 ? `${money(t.net, settings)} kept this month` : `${money(-t.net, settings)} more out than in`}
            </p>
          </Panel>
        </motion.div>

        {/* Pace chart */}
        <motion.div custom={2} variants={rise} initial="hidden" animate="show" className="md:col-span-4">
          <Panel className="h-full p-6 md:p-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <Eyebrow>Spending pace</Eyebrow>
                <h2 className="display mt-2 text-3xl">Day by day</h2>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-4 rounded bg-signal" /> Actual
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-0 w-4 border-t border-dashed border-ink/50" /> Budget pace
                </span>
              </div>
            </div>
            <PaceChart points={pace.points} settings={settings} />
          </Panel>
        </motion.div>

        {/* Category ring */}
        <motion.div custom={3} variants={rise} initial="hidden" animate="show" className="md:col-span-2">
          <Panel className="flex h-full flex-col p-6 md:p-8">
            <Eyebrow>Where it went</Eyebrow>
            <div className="mt-6 flex justify-center">
              <CategoryRing slices={cats.map((c) => ({ id: c.category.id, value: c.spent, color: c.category.color }))}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{list.filter((x) => x.kind === "expense").length} entries</p>
                <p className="display tabular mt-1 text-3xl">{money(t.expense, settings, { compact: true })}</p>
              </CategoryRing>
            </div>
            <ul className="mt-6 space-y-2.5">
              {cats
                .filter((c) => c.spent > 0)
                .slice(0, 5)
                .map((c) => (
                  <li key={c.category.id} className="flex items-center gap-3 text-sm">
                    <span className="size-2.5 rounded-full" style={{ background: c.category.color }} />
                    <span className="flex-1 truncate text-ink-2">{c.category.name}</span>
                    <span className="tabular font-medium">{t.expense ? percent(c.spent / t.expense) : "0%"}</span>
                  </li>
                ))}
            </ul>
          </Panel>
        </motion.div>

        {/* Budgets */}
        <motion.div custom={4} variants={rise} initial="hidden" animate="show" className="md:col-span-3">
          <Panel className="h-full p-6 md:p-8">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <Eyebrow>Envelopes</Eyebrow>
                <h2 className="display mt-2 text-3xl">Budgets</h2>
              </div>
              <Link href="/budget/plan" className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
                Plan <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <ul className="space-y-5">
              {cats
                .filter((c) => c.limit > 0)
                .slice(0, 6)
                .map((c) => (
                  <li key={c.category.id}>
                    <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span style={{ color: c.category.color }}>{c.category.glyph}</span>
                        {c.category.name}
                      </span>
                      <span className="tabular text-muted">
                        <span className={c.ratio > 1 ? "font-medium text-signal" : "text-ink"}>{money(c.spent, settings, { compact: true })}</span>
                        {" / "}
                        {money(c.limit, settings, { compact: true })}
                      </span>
                    </div>
                    <Meter ratio={c.ratio} color={c.category.color} />
                  </li>
                ))}
            </ul>
          </Panel>
        </motion.div>

        {/* Recent */}
        <motion.div custom={5} variants={rise} initial="hidden" animate="show" className="md:col-span-3">
          <Panel className="h-full p-4 md:p-6">
            <div className="mb-3 flex items-end justify-between px-3 pt-2">
              <div>
                <Eyebrow>Latest</Eyebrow>
                <h2 className="display mt-2 text-3xl">Activity</h2>
              </div>
              <Link href="/budget/transactions" className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
                All <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            {list.length ? (
              <ul>
                {list.slice(0, 6).map((tx, i) => (
                  <TransactionRow key={tx.id} tx={tx} state={state} index={i} />
                ))}
              </ul>
            ) : (
              <EmptyMonth onAdd={() => openComposer()} />
            )}
          </Panel>
        </motion.div>

        {/* Trend */}
        <motion.div custom={6} variants={rise} initial="hidden" animate="show" className="md:col-span-6">
          <Panel className="p-6 md:p-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>Six months</Eyebrow>
                <h2 className="display mt-2 text-3xl">In versus out</h2>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-positive" /> Income
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-signal" /> Spent
                </span>
              </div>
            </div>
            <TrendBars data={trend} settings={settings} active={month} />
          </Panel>
        </motion.div>
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "positive" }) {
  return (
    <Panel className="flex flex-col justify-between p-6">
      <Eyebrow>{label}</Eyebrow>
      <p className={`display tabular mt-4 text-[clamp(26px,6vw,40px)] ${tone === "positive" ? "text-positive" : ""}`}>{value}</p>
    </Panel>
  );
}

export function EmptyMonth({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <p className="display text-4xl italic text-muted">A blank page.</p>
      <p className="mt-2 max-w-xs text-sm text-muted">Nothing recorded for this month yet. Your first entry takes about four seconds.</p>
      <Button variant="primary" className="mt-6" onClick={onAdd}>
        <Plus className="size-4" /> Add an entry
      </Button>
    </div>
  );
}
