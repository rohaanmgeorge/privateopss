import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata: Metadata = { title: "Sign in" };

const LINES = ["Money", "Notes", "Tasks", "Vault", "Journal"];

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-[560px] rounded-full bg-signal/35 blur-[120px]" />
        <p className="relative inline-flex items-baseline gap-1">
          <span className="display text-3xl italic">Private</span>
          <span className="font-mono text-[11px] tracking-[0.2em] text-paper/50">/OS</span>
        </p>
        <div className="relative">
          <ul className="display text-[clamp(56px,7vw,112px)] leading-[0.92]">
            {LINES.map((l, i) => (
              <li key={l} className={i === 0 ? "text-paper" : "text-paper/20"}>
                {i === 0 ? <em>{l}.</em> : `${l}.`}
              </li>
            ))}
          </ul>
          <p className="mt-10 max-w-sm text-[15px] leading-relaxed text-paper/60">
            One private space for the parts of your life that matter. No feeds, no ads, no one else&apos;s data — starting with money.
          </p>
        </div>
        <p className="relative font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40">Est. 2026 · Built to be yours</p>
      </section>

      <section className="relative flex flex-col px-6 py-6 md:px-12">
        <div className="flex items-center justify-between">
          <p className="inline-flex items-baseline gap-1 lg:invisible">
            <span className="display text-[28px] italic">Private</span>
            <span className="font-mono text-[11px] tracking-[0.2em] text-muted">/OS</span>
          </p>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-16">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
