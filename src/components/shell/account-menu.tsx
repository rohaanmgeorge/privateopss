"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut, useAccount } from "@/lib/budget/store";

function initial(email: string | null) {
  return (email?.trim()[0] ?? "·").toUpperCase();
}

async function leave(router: ReturnType<typeof useRouter>, setBusy: (b: boolean) => void) {
  setBusy(true);
  await signOut();
  router.replace("/login");
  router.refresh();
}

/** Sidebar footer: who's signed in, plus sign out. */
export function AccountMenu() {
  const account = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-medium text-paper">{initial(account?.email ?? null)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{account?.email ?? " "}</p>
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          <span className="size-1.5 rounded-full bg-positive" /> Synced
        </p>
      </div>
      <button
        type="button"
        onClick={() => leave(router, setBusy)}
        disabled={busy}
        aria-label="Sign out"
        title="Sign out"
        className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-paper-2 hover:text-ink disabled:opacity-40"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

/** Compact avatar button for the mobile header. */
export function AccountButton() {
  const account = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      onClick={() => leave(router, setBusy)}
      disabled={busy}
      aria-label={`Sign out ${account?.email ?? ""}`.trim()}
      title="Sign out"
      className="grid size-9 place-items-center rounded-full bg-ink text-sm font-medium text-paper disabled:opacity-40"
    >
      {initial(account?.email ?? null)}
    </button>
  );
}
