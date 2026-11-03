"use client";

import { Download, RotateCcw, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { Button, Eyebrow, Panel } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { money } from "@/lib/budget/format";
import { budget } from "@/lib/budget/store";
import type { BudgetState } from "@/lib/budget/types";
import { BudgetGate } from "./budget-gate";

const CURRENCIES = [
  { code: "INR", locale: "en-IN", label: "Indian Rupee" },
  { code: "USD", locale: "en-US", label: "US Dollar" },
  { code: "EUR", locale: "de-DE", label: "Euro" },
  { code: "GBP", locale: "en-GB", label: "British Pound" },
  { code: "AED", locale: "en-AE", label: "UAE Dirham" },
  { code: "SGD", locale: "en-SG", label: "Singapore Dollar" },
  { code: "JPY", locale: "ja-JP", label: "Japanese Yen" },
];

export function SettingsView() {
  return <BudgetGate>{(state) => <Settings state={state} />}</BudgetGate>;
}

function Settings({ state }: { state: BudgetState }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportBackup = () => {
    const blob = new Blob([budget.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `private-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.show("Backup downloaded");
  };

  const importBackup = async (file: File) => {
    try {
      budget.importJSON(await file.text());
      toast.show("Backup restored");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Couldn’t read that file");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Budget · settings"
        title={
          <>
            Yours, <em>entirely</em>.
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="p-6 md:p-8">
          <Eyebrow>Currency</Eyebrow>
          <h2 className="display mt-2 text-3xl">Display money in</h2>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CURRENCIES.map((c) => {
              const on = state.settings.currency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  aria-pressed={on}
                  onClick={() => budget.updateSettings({ currency: c.code, locale: c.locale })}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${on ? "border-ink bg-ink text-paper" : "border-line hover:border-line-strong"}`}
                >
                  <span className="block font-mono text-xs tracking-wider">{c.code}</span>
                  <span className={`mt-0.5 block truncate text-xs ${on ? "text-paper/60" : "text-muted"}`}>{c.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-5 text-sm text-muted">
            Preview: <span className="tabular text-ink">{money(1234567, state.settings)}</span>. Changing currency relabels amounts; it does not convert them.
          </p>
        </Panel>

        <Panel className="p-6 md:p-8">
          <Eyebrow>Your data</Eyebrow>
          <h2 className="display mt-2 text-3xl">Lives on this device</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-2">
            Everything is stored locally in this browser — nothing leaves your machine. Download a backup now and then; sync
            and end-to-end encryption are on the roadmap.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-6 text-sm">
            <div>
              <dt className="text-muted">Entries</dt>
              <dd className="display tabular mt-1 text-3xl">{state.transactions.length}</dd>
            </div>
            <div>
              <dt className="text-muted">Categories</dt>
              <dd className="display tabular mt-1 text-3xl">{state.categories.length}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="primary" onClick={exportBackup}>
              <Download className="size-4" /> Export backup
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Restore
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importBackup(f);
                e.target.value = "";
              }}
            />
          </div>
        </Panel>

        <Panel className="p-6 md:col-span-2 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <Eyebrow>Start over</Eyebrow>
              <h2 className="display mt-2 text-3xl">Demo or a clean slate</h2>
              <p className="mt-2 max-w-lg text-sm text-muted">
                Load sample data to explore, or wipe every entry and begin fresh. Export a backup first if you want to keep anything.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  budget.loadDemo();
                  toast.show("Demo data loaded");
                }}
              >
                <Sparkles className="size-4" /> Load demo
              </Button>
              {confirmReset ? (
                <>
                  <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      budget.reset();
                      setConfirmReset(false);
                      toast.show("All entries cleared");
                    }}
                  >
                    Yes, erase everything
                  </Button>
                </>
              ) : (
                <Button variant="danger" onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="size-4" /> Reset
                </Button>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
