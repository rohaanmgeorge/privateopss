"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Kbd } from "@/components/ui/primitives";
import { AccountButton, AccountMenu } from "./account-menu";
import { isActive, MOBILE_NAV, NAV } from "./nav";
import { useOS } from "./os-provider";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-baseline gap-1 ${className}`} aria-label="Private OS home">
      <span className="display text-[28px] italic">Private</span>
      <span className="font-mono text-[11px] tracking-[0.2em] text-muted transition group-hover:text-signal">/OS</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { openComposer } = useOS();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[252px] shrink-0 flex-col border-r border-line px-5 py-6 lg:flex">
      <Wordmark className="px-2" />

      <button
        type="button"
        onClick={() => openComposer()}
        className="mt-8 flex h-11 items-center justify-between rounded-full bg-ink pl-4 pr-3 text-sm font-medium text-paper transition hover:opacity-90 active:scale-[0.98]"
      >
        <span className="inline-flex items-center gap-2">
          <Plus className="size-4" /> New entry
        </span>
        <Kbd>N</Kbd>
      </button>

      <nav className="mt-8 flex flex-1 flex-col gap-7 overflow-y-auto" aria-label="Primary">
        {NAV.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{group.title}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = !item.soon && isActive(pathname, item.href);
                const Icon = item.icon;
                if (item.soon) {
                  return (
                    <li key={item.href}>
                      <span className="flex h-9 cursor-not-allowed items-center gap-3 rounded-xl px-2 text-sm text-muted/70">
                        <Icon className="size-4" strokeWidth={1.6} />
                        {item.label}
                        <span className="ml-auto rounded-full border border-line px-1.5 font-mono text-[9px] uppercase tracking-wider">
                          soon
                        </span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={item.href} className="relative">
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-xl bg-paper-2"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <Link
                      href={item.href}
                      className={`relative flex h-9 items-center gap-3 rounded-xl px-2 text-sm transition ${
                        active ? "text-ink" : "text-ink-2 hover:text-ink"
                      }`}
                    >
                      <Icon className="size-4" strokeWidth={active ? 2 : 1.6} />
                      {item.label}
                      {active && <span className="ml-auto size-1.5 rounded-full bg-signal" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-6 space-y-4 border-t border-line pt-5">
        <div className="flex items-center justify-between px-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Appearance</span>
          <ThemeToggle />
        </div>
        <AccountMenu />
      </div>
    </aside>
  );
}

export function MobileBar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-paper/80 px-4 backdrop-blur-xl lg:hidden">
      <Wordmark />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <AccountButton />
      </div>
    </header>
  );
}

export function MobileDock() {
  const pathname = usePathname();
  const { openComposer } = useOS();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-full border border-line bg-card/90 p-1.5 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.35)] backdrop-blur-xl lg:hidden"
    >
      {MOBILE_NAV.slice(0, 2).map((item) => (
        <DockLink key={item.href} item={item} active={isActive(pathname, item.href)} />
      ))}
      <button
        type="button"
        onClick={() => openComposer()}
        aria-label="New entry"
        className="grid size-12 place-items-center rounded-full bg-signal text-signal-ink transition active:scale-95"
      >
        <Plus className="size-5" />
      </button>
      {MOBILE_NAV.slice(2).map((item) => (
        <DockLink key={item.href} item={item} active={isActive(pathname, item.href)} />
      ))}
    </nav>
  );
}

function DockLink({ item, active }: { item: (typeof MOBILE_NAV)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] transition ${
        active ? "bg-paper-2 text-ink" : "text-muted"
      }`}
    >
      <Icon className="size-[18px]" strokeWidth={active ? 2 : 1.6} />
      {item.label}
    </Link>
  );
}
