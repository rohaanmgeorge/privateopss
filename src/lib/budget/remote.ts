"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BudgetSettings, BudgetState, Category, Transaction } from "./types";

/* Row shapes as stored in Postgres (snake_case, timestamptz as ISO strings). */

interface SettingsRow {
  user_id: string;
  currency: string;
  locale: string;
  cycle_start_day: number;
}

interface CategoryRow {
  user_id: string;
  id: string;
  name: string;
  glyph: string;
  color: string;
  kind: Category["kind"];
  monthly_limit: number;
  fixed: boolean;
}

interface TransactionRow {
  id: string;
  user_id: string;
  kind: Transaction["kind"];
  amount: number;
  category_id: string;
  note: string;
  date: string;
  created_at: string;
}

export const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  glyph: r.glyph,
  color: r.color,
  kind: r.kind,
  monthlyLimit: Number(r.monthly_limit),
  fixed: r.fixed,
});

export const fromCategory = (userId: string, c: Category): CategoryRow => ({
  user_id: userId,
  id: c.id,
  name: c.name,
  glyph: c.glyph,
  color: c.color,
  kind: c.kind,
  monthly_limit: c.monthlyLimit,
  fixed: Boolean(c.fixed),
});

export const toTransaction = (r: TransactionRow): Transaction => ({
  id: r.id,
  kind: r.kind,
  amount: Number(r.amount),
  categoryId: r.category_id,
  note: r.note,
  date: r.date,
  createdAt: new Date(r.created_at).getTime(),
});

export const fromTransaction = (userId: string, t: Transaction): TransactionRow => ({
  id: t.id,
  user_id: userId,
  kind: t.kind,
  amount: t.amount,
  category_id: t.categoryId,
  note: t.note,
  date: t.date,
  created_at: new Date(t.createdAt).toISOString(),
});

export const fromSettings = (userId: string, s: BudgetSettings): SettingsRow => ({
  user_id: userId,
  currency: s.currency,
  locale: s.locale,
  cycle_start_day: s.cycleStartDay,
});

const PAGE = 1000; // PostgREST's default max rows per request

async function selectAll<T>(db: SupabaseClient, table: string, order: { column: string; ascending: boolean }[]) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = db.from(table).select("*");
    for (const o of order) q = q.order(o.column, { ascending: o.ascending });
    const { data, error } = await q.range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data as T[]));
    if (!data || data.length < PAGE) return rows;
  }
}

async function check<T extends { error: unknown }>(p: PromiseLike<T>) {
  const res = await p;
  if (res.error) throw res.error;
  return res;
}

function chunks<T>(list: T[], size = 500) {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/** Remote operations for the signed-in user. RLS scopes every query to them. */
export function remote(db: SupabaseClient, userId: string) {
  return {
    async fetchAll() {
      const [settings, categories, transactions] = await Promise.all([
        check(db.from("budget_settings").select("*").maybeSingle<SettingsRow>()),
        selectAll<CategoryRow>(db, "categories", [{ column: "created_at", ascending: true }]),
        selectAll<TransactionRow>(db, "transactions", [
          { column: "date", ascending: false },
          { column: "created_at", ascending: false },
        ]),
      ]);
      return {
        settings: settings.data
          ? { currency: settings.data.currency, locale: settings.data.locale, cycleStartDay: settings.data.cycle_start_day }
          : null,
        categories: categories.map(toCategory),
        transactions: transactions.map(toTransaction),
      };
    },
    upsertSettings: (s: BudgetSettings) => check(db.from("budget_settings").upsert(fromSettings(userId, s))),
    upsertCategories: (list: Category[]) =>
      check(db.from("categories").upsert(list.map((c) => fromCategory(userId, c)))),
    deleteCategory: (id: string) => check(db.from("categories").delete().eq("id", id)),
    insertTransaction: (t: Transaction) => check(db.from("transactions").insert(fromTransaction(userId, t))),
    upsertTransaction: (t: Transaction) => check(db.from("transactions").upsert(fromTransaction(userId, t))),
    deleteTransaction: (id: string) => check(db.from("transactions").delete().eq("id", id)),

    /** Replace everything the user has with `state` (used by restore, demo and reset). */
    async replaceAll(state: BudgetState) {
      await check(db.from("transactions").delete().eq("user_id", userId));
      await check(db.from("categories").delete().eq("user_id", userId));
      if (state.categories.length) await this.upsertCategories(state.categories);
      for (const batch of chunks(state.transactions)) {
        await check(db.from("transactions").insert(batch.map((t) => fromTransaction(userId, t))));
      }
      await this.upsertSettings(state.settings);
    },
  };
}

export type Remote = ReturnType<typeof remote>;
