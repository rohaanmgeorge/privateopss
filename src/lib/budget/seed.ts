import { toISODate } from "./dates";
import type { BudgetState, Category, Transaction } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "salary", name: "Salary", glyph: "◆", color: "var(--chart-5)", kind: "income", monthlyLimit: 0 },
  { id: "freelance", name: "Freelance", glyph: "✦", color: "var(--chart-4)", kind: "income", monthlyLimit: 0 },
  { id: "rent", name: "Rent & Home", glyph: "⌂", color: "var(--chart-1)", kind: "expense", monthlyLimit: 3_500_000, fixed: true },
  { id: "food", name: "Food & Dining", glyph: "◐", color: "var(--chart-2)", kind: "expense", monthlyLimit: 1_200_000 },
  { id: "transport", name: "Transport", glyph: "→", color: "var(--chart-3)", kind: "expense", monthlyLimit: 500_000 },
  { id: "shopping", name: "Shopping", glyph: "◇", color: "var(--chart-4)", kind: "expense", monthlyLimit: 800_000 },
  { id: "bills", name: "Bills & Utilities", glyph: "≋", color: "var(--chart-5)", kind: "expense", monthlyLimit: 600_000, fixed: true },
  { id: "fun", name: "Entertainment", glyph: "✺", color: "var(--chart-6)", kind: "expense", monthlyLimit: 400_000 },
  { id: "health", name: "Health", glyph: "+", color: "var(--chart-3)", kind: "expense", monthlyLimit: 300_000 },
];

/** Tiny deterministic PRNG so demo data looks the same on every fresh load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOTES: Record<string, string[]> = {
  food: ["Blue Tokai", "Groceries", "Dinner out", "Swiggy", "Bakery", "Lunch w/ team"],
  transport: ["Uber", "Metro card", "Fuel", "Rapido", "Parking"],
  shopping: ["Books", "Sneakers", "Desk lamp", "Gift", "Clothes"],
  bills: ["Electricity", "Internet", "Phone", "Water"],
  fun: ["Cinema", "Spotify", "Concert", "Netflix"],
  health: ["Pharmacy", "Gym", "Checkup"],
};

export function createSeedState(now = new Date()): BudgetState {
  const rand = mulberry32(20261103);
  const transactions: Transaction[] = [];
  let n = 0;
  const add = (date: Date, t: Omit<Transaction, "id" | "date" | "createdAt">) => {
    if (date > now) return;
    // Real UUIDs so demo rows can be stored in Postgres; +n keeps same-day order stable.
    transactions.push({ ...t, id: crypto.randomUUID(), date: toISODate(date), createdAt: date.getTime() + n++ });
  };

  for (let back = 3; back >= 0; back--) {
    const y = now.getFullYear();
    const m = now.getMonth() - back;
    add(new Date(y, m, 1), { kind: "income", amount: 12_500_000, categoryId: "salary", note: "Monthly salary" });
    add(new Date(y, m, 2), { kind: "expense", amount: 3_200_000, categoryId: "rent", note: "Rent" });
    if (rand() > 0.4) {
      add(new Date(y, m, 12 + Math.floor(rand() * 10)), {
        kind: "income",
        amount: Math.round((15_000 + rand() * 45_000) / 100) * 10_000,
        categoryId: "freelance",
        note: "Client project",
      });
    }
    for (let day = 1; day <= 31; day++) {
      const date = new Date(y, m, day);
      if (date.getMonth() !== ((m % 12) + 12) % 12) break;
      const count = Math.floor(rand() * 3);
      for (let i = 0; i < count; i++) {
        const cats = ["food", "food", "food", "transport", "transport", "shopping", "fun", "health", "bills"];
        const categoryId = cats[Math.floor(rand() * cats.length)];
        const base = { food: 600, transport: 300, shopping: 2_500, fun: 800, health: 900, bills: 1_800 }[categoryId] ?? 500;
        const amount = Math.round(base * (0.4 + rand() * 1.4)) * 100;
        const notes = NOTES[categoryId];
        add(date, { kind: "expense", amount, categoryId, note: notes[Math.floor(rand() * notes.length)] });
      }
    }
  }

  transactions.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));

  return {
    version: 1,
    settings: { currency: "INR", locale: "en-IN", cycleStartDay: 1 },
    categories: DEFAULT_CATEGORIES,
    transactions,
  };
}

export function createEmptyState(): BudgetState {
  return {
    version: 1,
    settings: { currency: "INR", locale: "en-IN", cycleStartDay: 1 },
    categories: DEFAULT_CATEGORIES,
    transactions: [],
  };
}
