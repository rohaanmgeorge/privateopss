"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";
import { money } from "@/lib/budget/format";
import { monthLabel } from "@/lib/budget/dates";
import type { BudgetSettings } from "@/lib/budget/types";

/* ───────────────────────── Pace chart ─────────────────────────
   Cumulative spend this month vs. the straight-line budget pace. */

interface PacePoint {
  day: number;
  cumulative: number | null;
  ideal: number;
}

export function PaceChart({ points, settings }: { points: PacePoint[]; settings: BudgetSettings }) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 260;
  const PAD = { t: 16, r: 8, b: 28, l: 8 };
  const max = Math.max(1, ...points.map((p) => Math.max(p.cumulative ?? 0, p.ideal))) * 1.08;
  const x = (day: number) => PAD.l + ((day - 1) / Math.max(1, points.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);

  const actual = points.filter((p) => p.cumulative !== null);
  const line = actual.map((p, i) => `${i ? "L" : "M"}${x(p.day)},${y(p.cumulative!)}`).join("");
  const area = actual.length ? `${line}L${x(actual[actual.length - 1].day)},${y(0)}L${x(1)},${y(0)}Z` : "";
  const ideal = `M${x(1)},${y(points[0]?.ideal ?? 0)}L${x(points.length)},${y(points[points.length - 1]?.ideal ?? 0)}`;
  const last = actual[actual.length - 1];
  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Cumulative spending compared to budget pace"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const rel = ((e.clientX - rect.left) / rect.width) * W;
          const idx = Math.round(((rel - PAD.l) / (W - PAD.l - PAD.r)) * (points.length - 1));
          setHover(Math.max(0, Math.min(points.length - 1, idx)));
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={PAD.l} x2={W - PAD.r} y1={y(max * f)} y2={y(max * f)} stroke="var(--line)" />
        ))}

        <path d={ideal} stroke="var(--ink)" strokeOpacity="0.35" strokeDasharray="3 5" fill="none" strokeWidth="1.25" />
        {area && (
          <motion.path d={area} fill={`url(#${gradientId})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        )}
        {line && (
          <motion.path
            d={line}
            fill="none"
            stroke="var(--signal)"
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
        {last && !hp && (
          <g>
            <circle cx={x(last.day)} cy={y(last.cumulative!)} r="10" fill="var(--signal)" opacity="0.15" />
            <circle cx={x(last.day)} cy={y(last.cumulative!)} r="4" fill="var(--signal)" />
          </g>
        )}

        {hp && (
          <g>
            <line x1={x(hp.day)} x2={x(hp.day)} y1={PAD.t} y2={H - PAD.b} stroke="var(--line-strong)" />
            {hp.cumulative !== null && <circle cx={x(hp.day)} cy={y(hp.cumulative)} r="4" fill="var(--signal)" />}
          </g>
        )}

        {points
          .filter((p) => p.day === 1 || p.day % 5 === 0)
          .map((p) => (
            <text key={p.day} x={x(p.day)} y={H - 6} textAnchor="middle" className="fill-muted font-mono text-[10px]">
              {String(p.day).padStart(2, "0")}
            </text>
          ))}
      </svg>

      {hp && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-lg"
          style={{ left: `${(x(hp.day) / W) * 100}%` }}
        >
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Day {hp.day}</p>
          <p className="tabular mt-0.5 font-medium">{hp.cumulative !== null ? money(hp.cumulative, settings) : "—"}</p>
          <p className="tabular text-muted">pace {money(hp.ideal, settings, { compact: true })}</p>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Trend bars ─────────────────────────
   Income vs. expense, trailing months. */

interface TrendPoint {
  key: string;
  income: number;
  expense: number;
}

export function TrendBars({ data, settings, active }: { data: TrendPoint[]; settings: BudgetSettings; active: string }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  return (
    <div className="flex h-52 items-end gap-3 md:gap-5" role="img" aria-label="Income and expense by month">
      {data.map((d, i) => {
        const on = d.key === active;
        return (
          <div key={d.key} className="group flex h-full flex-1 flex-col justify-end">
            <div className="relative flex flex-1 items-end justify-center gap-1">
              <motion.div
                className="w-full max-w-5 rounded-t-full"
                style={{ background: on ? "var(--positive)" : "var(--line-strong)" }}
                initial={{ height: 0 }}
                animate={{ height: `${(d.income / max) * 100}%` }}
                transition={{ delay: i * 0.06, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                title={`Income ${money(d.income, settings)}`}
              />
              <motion.div
                className="w-full max-w-5 rounded-t-full"
                style={{ background: on ? "var(--signal)" : "var(--ink)", opacity: on ? 1 : 0.75 }}
                initial={{ height: 0 }}
                animate={{ height: `${(d.expense / max) * 100}%` }}
                transition={{ delay: i * 0.06 + 0.04, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                title={`Spent ${money(d.expense, settings)}`}
              />
            </div>
            <p className={`mt-3 text-center font-mono text-[10px] uppercase tracking-wider ${on ? "text-ink" : "text-muted"}`}>
              {monthLabel(d.key, settings.locale, "short").split(" ")[0]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Category ring ───────────────────────── */

export function CategoryRing({
  slices,
  size = 220,
  children,
}: {
  slices: { id: string; value: number; color: string }[];
  size?: number;
  children?: React.ReactNode;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 42;
  const C = 2 * Math.PI * r;
  const gap = slices.filter((s) => s.value > 0).length > 1 ? 1.2 : 0;
  let offset = 0;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
        {slices
          .filter((s) => s.value > 0)
          .map((s, i) => {
            const len = (s.value / total) * C;
            const dash = Math.max(0, len - gap);
            const el = (
              <motion.circle
                key={s.id}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="9"
                strokeDashoffset={-offset}
                initial={{ strokeDasharray: `0 ${C}` }}
                animate={{ strokeDasharray: `${dash} ${C - dash}` }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}
