import type { Metadata } from "next";
import { SettingsView } from "@/components/budget/settings-view";

export const metadata: Metadata = { title: "Budget settings" };

export default function SettingsPage() {
  return <SettingsView />;
}
