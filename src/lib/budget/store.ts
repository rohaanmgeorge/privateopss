"use client";

import { useSyncExternalStore } from "react";
import { createEmptyState, createSeedState } from "./seed";
import type { BudgetSettings, BudgetState, Category, Transaction } from "./types";

/**
 * Local-first budget store.
 *
 * State lives in memory and is mirrored to localStorage. Every mutation goes
 * through `commit`, which keeps this file the single seam to replace with a
 * remote backend later.
 */

const STORAGE_KEY = "pos:budget:v1";

let state: BudgetState | null = null;
const listeners = new Set<() => void>();

function load(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BudgetState;
      if (parsed?.version === 1) return parsed;
    }
  } catch {
    // Corrupt or unavailable storage — fall back to demo data.
  }
  return createSeedState();
}

function commit(next: BudgetState) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked; keep the in-memory copy.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  if (!state) state = load();
  return state;
}

function getServerSnapshot() {
  return null;
}

/** Returns the budget state, or null during server render / before hydration. */
export function useBudget(): BudgetState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function sortTx(list: Transaction[]) {
  return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
}

export const budget = {
  addTransaction(input: Omit<Transaction, "id" | "createdAt">) {
    const s = getSnapshot();
    const tx: Transaction = { ...input, id: uid(), createdAt: Date.now() };
    commit({ ...s, transactions: sortTx([tx, ...s.transactions]) });
    return tx;
  },
  updateTransaction(id: string, patch: Partial<Omit<Transaction, "id">>) {
    const s = getSnapshot();
    commit({ ...s, transactions: sortTx(s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t))) });
  },
  removeTransaction(id: string) {
    const s = getSnapshot();
    commit({ ...s, transactions: s.transactions.filter((t) => t.id !== id) });
  },
  restoreTransaction(tx: Transaction) {
    const s = getSnapshot();
    commit({ ...s, transactions: sortTx([tx, ...s.transactions.filter((t) => t.id !== tx.id)]) });
  },
  upsertCategory(category: Category) {
    const s = getSnapshot();
    const exists = s.categories.some((c) => c.id === category.id);
    commit({
      ...s,
      categories: exists ? s.categories.map((c) => (c.id === category.id ? category : c)) : [...s.categories, category],
    });
  },
  createCategory(input: Omit<Category, "id">) {
    const c = { ...input, id: uid() };
    budget.upsertCategory(c);
    return c;
  },
  removeCategory(id: string) {
    const s = getSnapshot();
    if (s.transactions.some((t) => t.categoryId === id)) return false;
    commit({ ...s, categories: s.categories.filter((c) => c.id !== id) });
    return true;
  },
  updateSettings(patch: Partial<BudgetSettings>) {
    const s = getSnapshot();
    commit({ ...s, settings: { ...s.settings, ...patch } });
  },
  exportJSON() {
    return JSON.stringify(getSnapshot(), null, 2);
  },
  importJSON(json: string) {
    const parsed = JSON.parse(json) as BudgetState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.categories)) {
      throw new Error("That file isn't a Private OS budget export.");
    }
    commit({ ...parsed, transactions: sortTx(parsed.transactions) });
  },
  loadDemo() {
    commit(createSeedState());
  },
  reset() {
    commit(createEmptyState());
  },
};
