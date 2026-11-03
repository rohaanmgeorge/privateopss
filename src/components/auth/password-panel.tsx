"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button, Eyebrow, Panel } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Lets a signed-in user set or change their password (e.g. after first signing in by email link). */
export function PasswordPanel() {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords don’t match.");
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    setPassword("");
    setConfirm("");
    toast.show("Password saved — you can sign in with it now");
  };

  const field =
    "h-11 w-full rounded-full border border-line bg-transparent px-4 text-sm outline-none placeholder:text-muted focus:border-ink";

  return (
    <Panel className="p-6 md:col-span-2 md:p-8">
      <form onSubmit={submit} className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>Security</Eyebrow>
          <h2 className="display mt-2 text-3xl">Password</h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            Set a password to sign in without waiting for an email link. Leave it be if links work fine for you.
          </p>
          {error && (
            <p role="alert" className="mt-3 text-sm text-negative">
              {error}
            </p>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] md:w-[560px]">
          <input
            type="password"
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
            aria-label="New password"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={field}
            aria-label="Confirm new password"
          />
          <Button type="submit" variant="primary" disabled={busy || !password || !confirm}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Save
          </Button>
        </div>
      </form>
    </Panel>
  );
}
