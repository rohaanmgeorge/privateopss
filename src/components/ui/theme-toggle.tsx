"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme as Theme) ?? "light",
    () => null,
  );

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("pos:theme", next);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={`grid size-9 place-items-center rounded-full border border-line text-ink-2 transition hover:border-line-strong hover:text-ink ${className}`}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
