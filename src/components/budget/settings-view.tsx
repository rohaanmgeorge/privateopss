"use client";

import { Download, HardDriveUpload, Loader2, RotateCcw, Sparkles, Upload } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";
import { PasswordPanel } from "@/components/auth/password-panel";
import { PageHeader } from "@/components/shell/page-header";
import { Button, Eyebrow, Panel } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { money } from "@/lib/budget/format";
import { budget, clearLegacyLocalData, readLegacyLocalData, useAccount } from "@/lib/budget/store";
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

const noopSubscribe = () => () => {};

export function SettingsView() {
  return <BudgetGate>{(state) => <Settings state={state} />}</BudgetGate>;
}

function Settings({ state }: { state: BudgetState }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const account = useAccount();
  const legacy = useSyncExternalStore(noopSubscribe, readLegacyLocalData, () => null);
  const [legacyDismissed, setLegacyDismissed] = useState(false);

  /** Run a whole-account replace and report the outcome. Errors are already toasted by the store. */
  const run = async (label: string, task: () => Promise<void>, done: string) => {
    setBusy(label);
    try {
      await task();
      toast.show(done);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(null);
    }
  };

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
    const text = await file.text();
    try {
      JSON.parse(text);
    } catch {
      toast.show("Couldn’t read that file");
      return;
    }
    await run("restore", () => budget.importJSON(text), "Backup restored");
  };

  const importLegacy = async () => {
    if (!legacy) return;
    if (await run("legacy", () => budget.importJSON(legacy), "Browser data imported to your account")) {
      clearLegacyLocalData();
      setLegacyDismissed(true);
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

      {legacy && !legacyDismissed && (
        <Panel className="mb-4 flex flex-col gap-4 border-signal/40 bg-signal/5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <Eyebrow>Found on this browser</Eyebrow>
            <h2 className="display mt-2 text-3xl">Bring your earlier entries along</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Data saved here before you had an account can be moved into it. This replaces what’s currently in your account.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setLegacyDismissed(true)}>Not now</Button>
            <Button variant="signal" onClick={importLegacy} disabled={busy !== null}>
              {busy === "legacy" ? <Loader2 className="size-4 animate-spin" /> : <HardDriveUpload className="size-4" />} Import
            </Button>
          </div>
        </Panel>
      )}

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
          <h2 className="display mt-2 text-3xl">Synced to your account</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-2">
            Signed in as <span className="font-medium text-ink">{account?.email ?? "you"}</span>. Your entries are stored in
            your private database and follow you across devices; row-level security means only your account can read them.
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
            <Button onClick={() => fileRef.current?.click()} disabled={busy !== null}>
              {busy === "restore" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Restore
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

        <PasswordPanel />

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
              <Button disabled={busy !== null} onClick={() => run("demo", budget.loadDemo, "Demo data loaded")}>
                {busy === "demo" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Load demo
              </Button>
              {confirmReset ? (
                <>
                  <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
                  <Button
                    variant="danger"
                    disabled={busy !== null}
                    onClick={async () => {
                      await run("reset", budget.reset, "All entries cleared");
                      setConfirmReset(false);
                    }}
                  >
                    {busy === "reset" && <Loader2 className="size-4 animate-spin" />} Yes, erase everything
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
