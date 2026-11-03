import type { Metadata } from "next";
import { OverviewView } from "@/components/budget/overview-view";

export const metadata: Metadata = { title: "Budget" };

export default function BudgetPage() {
  return <OverviewView />;
}
