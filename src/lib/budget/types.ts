export type TransactionKind = "expense" | "income";

export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  /** Emoji or short glyph used as the category's mark */
  glyph: string;
  /** CSS colour (token var or hex) */
  color: string;
  kind: TransactionKind;
  /** Monthly limit in minor units (cents/paise). 0 = no budget set. */
  monthlyLimit: number;
}

export interface Transaction {
  id: string;
  kind: TransactionKind;
  /** Always positive, in minor units */
  amount: number;
  categoryId: CategoryId;
  note: string;
  /** ISO date, yyyy-mm-dd */
  date: string;
  createdAt: number;
}

export interface BudgetSettings {
  currency: string;
  locale: string;
  /** Day of month the budget cycle starts on (1–28) */
  cycleStartDay: number;
}

export interface BudgetState {
  version: 1;
  settings: BudgetSettings;
  categories: Category[];
  transactions: Transaction[];
}
