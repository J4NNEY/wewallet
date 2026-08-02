"use client";

import Link from "next/link";
import { StickyNote, DollarSign, Bell, Calculator, ShoppingCart } from "lucide-react";

const quickActions = [
  { name: "Catatan", href: "/notes", icon: StickyNote, color: "bg-tertiary-fixed text-tertiary" },
  { name: "Keuangan", href: "/finance", icon: DollarSign, color: "bg-secondary-container text-secondary" },
  { name: "Belanja", href: "/shopping", icon: ShoppingCart, color: "bg-primary-fixed text-primary-text" },
  { name: "Reminder", href: "/reminders", icon: Bell, color: "bg-soft-strong text-primary-text" },
  { name: "Kalkulator", href: "/calculator", icon: Calculator, color: "bg-primary text-on-primary" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-5 gap-2">
      {quickActions.map((action) => (
        <Link
          key={action.name}
          href={action.href}
          className="flex flex-col items-center gap-1.5 group"
        >
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${action.color} flex items-center justify-center shadow-card transition-transform duration-150 active:scale-95 group-hover:-translate-y-0.5`}
          >
            <action.icon className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-medium text-on-surface text-center">{action.name}</span>
        </Link>
      ))}
    </div>
  );
}
