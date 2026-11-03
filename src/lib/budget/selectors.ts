import { daysInMonth, monthKey, shiftMonth, today } from "./dates";
import type { BudgetState, Category, Transaction } from "./types";

export function txInMonth(state: BudgetState, key: string) {
  return state.transactions.filter((t) => monthKey(t.date) === key);
}

export function totals(list: Transaction[]) {
  let income = 0;
  let expense = 0;
  for (const t of list) {
    if (t.kind === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, net: income - expense, savingsRate: income > 0 ? (income - expense) / income : 0 };
}

export interface CategorySpend {
  category: Category;
  spent: number;
  limit: number;
  /** spent / limit, or 0 when no limit */
  ratio: number;
  count: number;
}

export function spendByCategory(state: BudgetState, key: string): CategorySpend[] {
  const list = txInMonth(state, key);
  return state.categories
    .filter((c) => c.kind === "expense")
    .map((category) => {
      const items = list.filter((t) => t.categoryId === category.id && t.kind === "expense");
      const spent = items.reduce((s, t) => s + t.amount, 0);
      return {
        category,
        spent,
        limit: category.monthlyLimit,
        ratio: category.monthlyLimit > 0 ? spent / category.monthlyLimit : 0,
        count: items.length,
      };
    })
    .sort((a, b) => b.spent - a.spent);
}

/** Cumulative daily spend for a month, plus the ideal pace line against the total budget. */
export function dailyPace(state: BudgetState, key: string) {
  const days = daysInMonth(key);
  const list = txInMonth(state, key).filter((t) => t.kind === "expense");
  const perDay = new Array<number>(days).fill(0);
  for (const t of list) perDay[Number(t.date.slice(8, 10)) - 1] += t.amount;

  const isCurrent = key === monthKey(today());
  const lastDay = isCurrent ? Number(today().slice(8, 10)) : days;
  const totalBudget = state.categories.filter((c) => c.kind === "expense").reduce((s, c) => s + c.monthlyLimit, 0);

  let running = 0;
  const points = perDay.map((amount, i) => {
    running += amount;
    return { day: i + 1, amount, cumulative: i < lastDay ? running : null, ideal: (totalBudget * (i + 1)) / days };
  });
  return { points, totalBudget, lastDay, days };
}

/** Income vs. expense for the trailing N months ending at `key`. */
export function monthlyTrend(state: BudgetState, key: string, months = 6) {
  return Array.from({ length: months }, (_, i) => {
    const k = shiftMonth(key, i - (months - 1));
    return { key: k, ...totals(txInMonth(state, k)) };
  });
}

export function categoryMap(state: BudgetState) {
  return new Map(state.categories.map((c) => [c.id, c]));
}

/** Group transactions by day, newest first. */
export function groupByDay(list: Transaction[]) {
  const groups: { date: string; items: Transaction[]; net: number }[] = [];
  for (const t of list) {
    let g = groups[groups.length - 1];
    if (!g || g.date !== t.date) {
      g = { date: t.date, items: [], net: 0 };
      groups.push(g);
    }
    g.items.push(t);
    g.net += t.kind === "income" ? t.amount : -t.amount;
  }
  return groups;
}

/** Projected month-end spend assuming the current daily average holds. */
export function forecast(state: BudgetState, key: string) {
  const { points, lastDay, days, totalBudget } = dailyPace(state, key);
  const spent = points[lastDay - 1]?.cumulative ?? 0;
  const projected = lastDay > 0 ? Math.round((spent / lastDay) * days) : 0;
  return { spent, projected, totalBudget, daysLeft: days - lastDay, safeDaily: Math.max(0, totalBudget - spent) / Math.max(1, days - lastDay) };
}
