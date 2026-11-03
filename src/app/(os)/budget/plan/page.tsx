import type { Metadata } from "next";
import { PlanView } from "@/components/budget/plan-view";

export const metadata: Metadata = { title: "Plan" };

export default function PlanPage() {
  return <PlanView />;
}
