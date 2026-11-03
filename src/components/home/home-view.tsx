"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, BookOpen, CheckSquare, KeyRound, NotebookPen, type LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useOS } from "@/components/shell/os-provider";
import { Eyebrow, Kbd, Meter } from "@/components/ui/primitives";
import { Money } from "@/components/ui/money";
import { monthKey, today } from "@/lib/budget/dates";
import { money } from "@/lib/budget/format";
import { forecast, spendByCategory, totals, txInMonth } from "@/lib/budget/selectors";
import { useBudget } from "@/lib/budget/store";

function subscribeClock(cb: () => void) {
  const id = setInterval(cb, 1000 * 15);
  return () => clearInterval(id);
}
// Minute resolution keeps the snapshot stable between ticks.
const getMinute = () => Math.floor(Date.now() / 60_000);

function useNow() {
  const minute = useSyncExternalStore(subscribeClock, getMinute, () => null);
  return minute === null ? null : new Date(minute * 60_000);
}

function greeting(h: number) {
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

const SOON: { label: string; blurb: string; icon: LucideIcon }[] = [
  { label: "Notes", blurb: "Thoughts, linked and searchable.", icon: NotebookPen },
  { label: "Tasks", blurb: "A calm list for what matters today.", icon: CheckSquare },
  { label: "Vault", blurb: "Passwords & documents, sealed.", icon: KeyRound },
  { label: "Journal", blurb: "One line a day, for years.", icon: BookOpen },
];

export function HomeView() {
  const now = useNow();
  const state = useBudget();
  const { openComposer } = useOS();

  // `state` is only non-null in the browser, so date reads stay out of the prerender.
  const key = state ? monthKey(today()) : "";
  const t = state ? totals(txInMonth(state, key)) : null;
  const fc = state ? forecast(state, key) : null;
  const top = state ? spendByCategory(state, key).filter((c) => c.limit > 0).slice(0, 3) : [];

  return (
    <div className="flex flex-col gap-10 md:gap-16">
      <section className="pt-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Eyebrow>
            {now
              ? now.toLocaleDateString(state?.settings.locale ?? "en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
              : " "}
          </Eyebrow>
        </motion.div>
        <h1 className="display mt-4 text-[clamp(56px,11vw,168px)]">
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {now ? greeting(now.getHours()) : "Welcome"},
          </motion.span>
          <motion.span
            className="block italic text-muted"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            this is <span className="text-signal not-italic">yours</span>.
          </motion.span>
        </h1>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink-2">
          <span className="display tabular text-4xl text-ink">
            {now ? now.toLocaleTimeString(state?.settings.locale ?? "en-IN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          </span>
          <span className="max-w-sm text-muted">
            A private operating system for your life. One space, no feeds, no ads — starting with money.
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-6">
        <motion.div
          className="md:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/budget"
            className="group relative flex h-full min-h-[340px] flex-col justify-between overflow-hidden rounded-[32px] bg-ink p-7 text-paper md:p-10"
          >
            <div className="pointer-events-none absolute -bottom-32 -right-20 size-[420px] rounded-full bg-signal/30 blur-[100px] transition duration-700 group-hover:bg-signal/45" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50">01 — Budget</p>
                <p className="mt-2 text-sm text-paper/70">Left to spend this month</p>
              </div>
              <span className="grid size-11 place-items-center rounded-full border border-paper/20 transition duration-500 group-hover:rotate-45 group-hover:bg-signal group-hover:border-signal">
                <ArrowUpRight className="size-5" />
              </span>
            </div>
            <div className="relative">
              {state && fc && t ? (
                <>
                  <Money minor={fc.totalBudget - t.expense} settings={state.settings} className="text-[clamp(56px,9vw,120px)] [&_.text-muted]:text-paper/40" />
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {top.map((c) => (
                      <div key={c.category.id}>
                        <div className="mb-2 flex justify-between text-xs text-paper/60">
                          <span>{c.category.name}</span>
                          <span className="tabular">{money(c.spent, state.settings, { compact: true })}</span>
                        </div>
                        <div className="[&_div]:bg-paper/15">
                          <Meter ratio={c.ratio} color="var(--paper)" />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-28 w-2/3 animate-pulse rounded-2xl bg-paper/10" />
              )}
            </div>
          </Link>
        </motion.div>

        <motion.div
          className="grid gap-4 md:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            type="button"
            onClick={() => openComposer()}
            className="group flex flex-col justify-between rounded-[32px] bg-signal p-7 text-left text-signal-ink transition hover:brightness-105"
          >
            <span className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">
              Quick entry <Kbd>N</Kbd>
            </span>
            <span className="display mt-10 text-5xl">
              Log a<br />
              <em>spend</em>
            </span>
          </button>
          <div className="rounded-[32px] border border-line bg-card p-7">
            <Eyebrow>This month</Eyebrow>
            {state && t ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">In</dt>
                  <dd className="tabular font-medium text-positive">{money(t.income, state.settings)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Out</dt>
                  <dd className="tabular font-medium">{money(t.expense, state.settings)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3">
                  <dt className="text-muted">Kept</dt>
                  <dd className="display tabular text-2xl">{money(t.net, state.settings)}</dd>
                </div>
              </dl>
            ) : (
              <div className="mt-4 h-24 animate-pulse rounded-xl bg-line" />
            )}
          </div>
        </motion.div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="display text-4xl">
            Coming to <em>your</em> OS
          </h2>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-muted md:block">02 — 05</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SOON.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.6 }}
                className="group relative overflow-hidden rounded-[28px] border border-dashed border-line-strong p-6 transition hover:border-solid hover:bg-card"
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-5 text-ink-2" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">0{i + 2}</span>
                </div>
                <p className="display mt-12 text-3xl">{m.label}</p>
                <p className="mt-1 text-sm text-muted">{m.blurb}</p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
