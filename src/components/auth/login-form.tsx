"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createAccount } from "@/app/login/actions";
import { supabaseBrowser } from "@/lib/supabase/client";

type Method = "password" | "link";
type Mode = "signin" | "signup";
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function callbackUrl(next: string | null) {
  const url = new URL("/auth/callback", window.location.origin);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

/** Turn Supabase auth errors into something a person can act on. */
function friendly(message: string) {
  if (/rate limit/i.test(message)) return "Too many emails sent recently. Use a password instead, or try the link again in an hour.";
  if (/invalid login credentials/i.test(message)) return "That email and password don’t match. If you’ve only used email links, sign in with a link and set a password in Settings.";
  if (/provider is not enabled/i.test(message)) return "Google sign-in isn’t switched on yet. Use a password or email link for now.";
  return message;
}

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next");
  const linkError = params.get("error");
  const [method, setMethod] = useState<Method>("password");
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState<Status>(linkError ? { kind: "error", message: linkError } : { kind: "idle" });
  const busy = status.kind === "sending";

  const enter = () => window.location.assign(safeNext(next));

  const withPassword = async (e: FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address || !password) return;
    setStatus({ kind: "sending" });
    if (mode === "signup") {
      const created = await createAccount(address, password);
      if (!created.ok) return setStatus({ kind: "error", message: created.error });
    }
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: address, password });
    if (error) return setStatus({ kind: "error", message: friendly(error.message) });
    enter();
  };

  const sendLink = async (e: FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setStatus({ kind: "sending" });
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: callbackUrl(next), shouldCreateUser: true },
    });
    setStatus(error ? { kind: "error", message: friendly(error.message) } : { kind: "sent", email: address });
  };

  const withGoogle = async () => {
    setStatus({ kind: "sending" });
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl(next) },
    });
    if (error) setStatus({ kind: "error", message: friendly(error.message) });
  };

  const inputClass =
    "h-12 w-full rounded-full border border-line bg-card px-5 text-sm outline-none placeholder:text-muted focus:border-ink";

  return (
    <div className="w-full max-w-[400px]">
      <AnimatePresence mode="wait">
        {status.kind === "sent" ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <span className="grid size-14 place-items-center rounded-full bg-signal text-signal-ink">
              <Mail className="size-6" />
            </span>
            <h2 className="display mt-8 text-5xl">
              Check your <em>inbox</em>.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
              We sent a sign-in link to <span className="font-medium text-ink">{status.email}</span>. Open it on this device to
              continue.
            </p>
            <button
              type="button"
              onClick={() => setStatus({ kind: "idle" })}
              className="mt-8 text-sm text-muted underline underline-offset-4 hover:text-ink"
            >
              Use a different email
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              {mode === "signup" && method === "password" ? "Create your space" : "Sign in · or create your space"}
            </p>
            <h2 className="display mt-4 text-5xl">
              {mode === "signup" && method === "password" ? (
                <>
                  Make it <em>yours</em>.
                </>
              ) : (
                <>
                  Enter <em>your</em> OS.
                </>
              )}
            </h2>

            <button
              type="button"
              onClick={withGoogle}
              disabled={busy}
              className="mt-10 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line-strong text-sm font-medium transition hover:bg-paper-2 disabled:opacity-50"
            >
              <GoogleMark /> Continue with Google
            </button>

            <div className="my-6 flex items-center gap-4 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
            </div>

            <div role="tablist" aria-label="Sign-in method" className="mb-4 grid grid-cols-2 rounded-full border border-line p-1">
              {(
                [
                  ["password", "Password"],
                  ["link", "Email link"],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={method === m}
                  onClick={() => {
                    setMethod(m);
                    setStatus({ kind: "idle" });
                  }}
                  className={`relative h-9 rounded-full text-sm transition ${method === m ? "text-paper" : "text-ink-2 hover:text-ink"}`}
                >
                  {method === m && (
                    <motion.span
                      layoutId="method-pill"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>

            {method === "password" ? (
              <form onSubmit={withPassword} className="space-y-3">
                <label className="block">
                  <span className="sr-only">Email address</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </label>
                <label className="relative block">
                  <span className="sr-only">Password</span>
                  <input
                    type={reveal ? "text" : "password"}
                    required
                    minLength={mode === "signup" ? 8 : undefined}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Choose a password (8+ characters)" : "Password"}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    aria-label={reveal ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-ink"
                  >
                    {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </label>
                <button
                  type="submit"
                  disabled={busy || !email.trim() || !password}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-40"
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      {mode === "signup" ? "Create account" : "Sign in"} <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
                <p className="pt-1 text-center text-sm text-muted">
                  {mode === "signin" ? "New here? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "signin" ? "signup" : "signin");
                      setStatus({ kind: "idle" });
                    }}
                    className="text-ink underline underline-offset-4"
                  >
                    {mode === "signin" ? "Create an account" : "Sign in"}
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={sendLink} className="space-y-3">
                <label className="block">
                  <span className="sr-only">Email address</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy || !email.trim()}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-40"
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Email me a sign-in link <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {status.kind === "error" && (
              <p role="alert" className="mt-5 rounded-2xl border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
                {status.message}
              </p>
            )}

            <p className="mt-8 text-xs leading-relaxed text-muted">
              Your data is private to your account and protected by row-level security.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
