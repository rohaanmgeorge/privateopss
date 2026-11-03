import type { BudgetSettings } from "./types";

const formatterCache = new Map<string, Intl.NumberFormat>();

function formatter(settings: BudgetSettings, compact: boolean) {
  const key = `${settings.locale}|${settings.currency}|${compact}`;
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(settings.locale, {
      style: "currency",
      currency: settings.currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 2,
      minimumFractionDigits: compact ? 0 : 2,
    });
    formatterCache.set(key, f);
  }
  return f;
}

/** Format minor units (cents) as a currency string. */
export function money(minor: number, settings: BudgetSettings, opts: { compact?: boolean } = {}) {
  return formatter(settings, opts.compact ?? false).format(minor / 100);
}

/** Split a formatted amount into whole and fractional parts for typographic treatment. */
export function moneyParts(minor: number, settings: BudgetSettings) {
  const parts = formatter(settings, false).formatToParts(minor / 100);
  let whole = "";
  let fraction = "";
  let seenDecimal = false;
  for (const p of parts) {
    if (p.type === "decimal") {
      seenDecimal = true;
      fraction += p.value;
    } else if (seenDecimal && p.type === "fraction") {
      fraction += p.value;
    } else if (!seenDecimal || p.type === "currency") {
      whole += p.value;
    } else {
      fraction += p.value;
    }
  }
  return { whole, fraction };
}

/** Parse a user-typed amount ("1,234.5") into minor units. Returns null if invalid. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[^\d.]/g, "");
  if (!cleaned || cleaned.split(".").length > 2) return null;
  const value = Math.round(parseFloat(cleaned) * 100);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function percent(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}
