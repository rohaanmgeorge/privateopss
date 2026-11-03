"use client";

import { useSyncExternalStore } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { remote, type Remote } from "./remote";
import { createEmptyState, createSeedState, DEFAULT_CATEGORIES } from "./seed";
import type { BudgetSettings, BudgetState, Category, Transaction } from "./types";

/**
 * Budget store, synced to Supabase.
 *
 * The UI reads one in-memory snapshot. Mutations apply optimistically, then
 * persist; if a write fails we surface the error and reload from the server
 * so the screen never drifts from the database.
 */

export interface Account {
  id: string;
  email: string | null;
}

/** Pre-Supabase data saved in this browser, offered for one-time import. */
export const LEGACY_STORAGE_KEY = "pos:budget:v1";

let state: BudgetState | null = null;
let account: Account | null = null;
let api: Remote | null = null;
let started = false;
const listeners = new Set<() => void>();
const errorListeners = new Set<(message: string) => void>();

const emit = () => listeners.forEach((l) => l());

function fail(err: unknown) {
  const message = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String(err.message) : "Sync failed";
  errorListeners.forEach((l) => l(message));
}

function sortTx(list: Transaction[]) {
  return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
}

async function load() {
  if (!api) return;
  try {
    const data = await api.fetchAll();
    let { categories } = data;
    let settings = data.settings;
    // First sign-in: give the new account default categories and settings.
    if (!categories.length && !data.transactions.length) {
      categories = DEFAULT_CATEGORIES;
      await api.upsertCategories(categories);
    }
    if (!settings) {
      settings = createEmptyState().settings;
      await api.upsertSettings(settings);
    }
    state = { version: 1, settings, categories, transactions: data.transactions };
    emit();
  } catch (err) {
    fail(err);
  }
}

function setUser(user: { id: string; email?: string | null } | null) {
  if (user?.id === account?.id) return;
  account = user ? { id: user.id, email: user.email ?? null } : null;
  state = null;
  api = user ? remote(supabaseBrowser(), user.id) : null;
  emit();
  if (user) void load();
}

function start() {
  if (started) return;
  started = true;
  const db = supabaseBrowser();
  db.auth.getUser().then(({ data }) => setUser(data.user));
  db.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Returns the budget state, or null until the signed-in user's data has loaded. */
export function useBudget(): BudgetState | null {
  return useSyncExternalStore(subscribe, () => state, () => null);
}

export function useAccount(): Account | null {
  return useSyncExternalStore(subscribe, () => account, () => null);
}

/** Subscribe to sync errors (used to show a toast). */
export function onSyncError(listener: (message: string) => void) {
  errorListeners.add(listener);
  return () => errorListeners.delete(listener);
}

/** Apply a change locally now, then persist; on failure, report and resync. */
function mutate(next: BudgetState, persist: (api: Remote) => PromiseLike<unknown>) {
  if (!api) return;
  state = next;
  emit();
  const current = api;
  Promise.resolve(persist(current)).catch((err) => {
    fail(err);
    if (api === current) void load();
  });
}

function snapshot() {
  if (!state) throw new Error("Budget data hasn't loaded yet.");
  return state;
}

export const budget = {
  addTransaction(input: Omit<Transaction, "id" | "createdAt">) {
    const s = snapshot();
    const tx: Transaction = { ...input, id: crypto.randomUUID(), createdAt: Date.now() };
    mutate({ ...s, transactions: sortTx([tx, ...s.transactions]) }, (r) => r.insertTransaction(tx));
    return tx;
  },
  updateTransaction(id: string, patch: Partial<Omit<Transaction, "id">>) {
    const s = snapshot();
    const existing = s.transactions.find((t) => t.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    mutate({ ...s, transactions: sortTx(s.transactions.map((t) => (t.id === id ? updated : t))) }, (r) =>
      r.upsertTransaction(updated),
    );
  },
  removeTransaction(id: string) {
    const s = snapshot();
    mutate({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }, (r) => r.deleteTransaction(id));
  },
  restoreTransaction(tx: Transaction) {
    const s = snapshot();
    mutate({ ...s, transactions: sortTx([tx, ...s.transactions.filter((t) => t.id !== tx.id)]) }, (r) =>
      r.upsertTransaction(tx),
    );
  },
  upsertCategory(category: Category) {
    const s = snapshot();
    const exists = s.categories.some((c) => c.id === category.id);
    mutate(
      {
        ...s,
        categories: exists ? s.categories.map((c) => (c.id === category.id ? category : c)) : [...s.categories, category],
      },
      (r) => r.upsertCategories([category]),
    );
  },
  createCategory(input: Omit<Category, "id">) {
    const c = { ...input, id: crypto.randomUUID() };
    budget.upsertCategory(c);
    return c;
  },
  removeCategory(id: string) {
    const s = snapshot();
    if (s.transactions.some((t) => t.categoryId === id)) return false;
    mutate({ ...s, categories: s.categories.filter((c) => c.id !== id) }, (r) => r.deleteCategory(id));
    return true;
  },
  updateSettings(patch: Partial<BudgetSettings>) {
    const s = snapshot();
    const settings = { ...s.settings, ...patch };
    mutate({ ...s, settings }, (r) => r.upsertSettings(settings));
  },
  exportJSON() {
    return JSON.stringify(snapshot(), null, 2);
  },
  /** Replace all data with a backup. Resolves once saved. */
  async importJSON(json: string) {
    const parsed = JSON.parse(json) as BudgetState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.categories)) {
      throw new Error("That file isn't a Private OS budget export.");
    }
    await replaceAll(normaliseImport(parsed));
  },
  loadDemo: () => replaceAll(createSeedState()),
  reset: () => replaceAll(createEmptyState()),
};

async function replaceAll(next: BudgetState) {
  if (!api) throw new Error("Sign in first.");
  const current = api;
  state = { ...next, transactions: sortTx(next.transactions) };
  emit();
  try {
    await current.replaceAll(state);
  } catch (err) {
    fail(err);
    if (api === current) await load();
    throw err;
  }
}

/** Older local exports used non-UUID ids ("seed-12"); give those fresh ids. */
function normaliseImport(s: BudgetState): BudgetState {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return {
    ...s,
    transactions: s.transactions.map((t) => (uuid.test(t.id) ? t : { ...t, id: crypto.randomUUID() })),
  };
}

/** Data saved in this browser before accounts existed, if any. */
export function readLegacyLocalData(): string | null {
  try {
    return localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearLegacyLocalData() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {}
}

export async function signOut() {
  await supabaseBrowser().auth.signOut();
  setUser(null);
}
