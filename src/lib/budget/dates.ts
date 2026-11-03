/** Local-date helpers working on ISO yyyy-mm-dd strings (no timezone drift). */

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function today() {
  return toISODate(new Date());
}

/** "2026-11" style key for grouping by month. */
export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toISODate(d).slice(0, 7);
}

export function monthLabel(key: string, locale: string, style: "long" | "short" = "long") {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: style, year: "numeric" });
}

export function daysInMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function relativeDay(iso: string, locale: string) {
  const t = today();
  if (iso === t) return "Today";
  const yesterday = toISODate(new Date(Date.now() - 86_400_000));
  if (iso === yesterday) return "Yesterday";
  return fromISODate(iso).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
}
