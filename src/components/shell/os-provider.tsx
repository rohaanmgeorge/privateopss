"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { monthKey, shiftMonth, today } from "@/lib/budget/dates";
import type { Transaction } from "@/lib/budget/types";

interface ComposerState {
  open: boolean;
  /** When set, the composer edits this transaction instead of creating one. */
  editing: Transaction | null;
}

interface OSContextValue {
  month: string;
  setMonth: (key: string) => void;
  stepMonth: (delta: number) => void;
  isCurrentMonth: boolean;
  composer: ComposerState;
  openComposer: (tx?: Transaction) => void;
  closeComposer: () => void;
}

const OSContext = createContext<OSContextValue | null>(null);

export function OSProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(() => monthKey(today()));
  const [composer, setComposer] = useState<ComposerState>({ open: false, editing: null });

  const stepMonth = useCallback((delta: number) => setMonth((m) => shiftMonth(m, delta)), []);
  const openComposer = useCallback((tx?: Transaction) => setComposer({ open: true, editing: tx ?? null }), []);
  const closeComposer = useCallback(() => setComposer((c) => ({ ...c, open: false })), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        openComposer();
      } else if (e.key === "[") {
        stepMonth(-1);
      } else if (e.key === "]") {
        stepMonth(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openComposer, stepMonth]);

  const value = useMemo(
    () => ({
      month,
      setMonth,
      stepMonth,
      isCurrentMonth: month === monthKey(today()),
      composer,
      openComposer,
      closeComposer,
    }),
    [month, stepMonth, composer, openComposer, closeComposer],
  );

  return <OSContext value={value}>{children}</OSContext>;
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error("useOS must be used inside <OSProvider>");
  return ctx;
}
