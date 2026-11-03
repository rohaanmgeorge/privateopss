import { BookOpen, CheckSquare, Home, KeyRound, LayoutGrid, ListOrdered, NotebookPen, Settings2, Target, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}

export const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "Space",
    items: [{ href: "/", label: "Home", icon: Home }],
  },
  {
    title: "Budget",
    items: [
      { href: "/budget", label: "Overview", icon: LayoutGrid },
      { href: "/budget/transactions", label: "Transactions", icon: ListOrdered },
      { href: "/budget/plan", label: "Plan", icon: Target },
      { href: "/budget/settings", label: "Settings", icon: Settings2 },
    ],
  },
  {
    title: "Coming soon",
    items: [
      { href: "#notes", label: "Notes", icon: NotebookPen, soon: true },
      { href: "#tasks", label: "Tasks", icon: CheckSquare, soon: true },
      { href: "#vault", label: "Vault", icon: KeyRound, soon: true },
      { href: "#journal", label: "Journal", icon: BookOpen, soon: true },
    ],
  },
];

export const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/budget", label: "Budget", icon: LayoutGrid },
  { href: "/budget/transactions", label: "Activity", icon: ListOrdered },
  { href: "/budget/plan", label: "Plan", icon: Target },
];

export function isActive(pathname: string, href: string) {
  if (href === "/" || href === "/budget") return pathname === href;
  return pathname.startsWith(href);
}
