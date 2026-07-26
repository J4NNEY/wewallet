"use client";

import Link from "next/link";
import { StickyNote, DollarSign, Bell, Calculator, ShoppingCart } from "lucide-react";

const quickActions = [
  { name: "Catatan", href: "/notes", icon: StickyNote, color: "bg-purple-100 text-purple-600" },
  { name: "Keuangan", href: "/finance", icon: DollarSign, color: "bg-emerald-100 text-emerald-600" },
  { name: "Belanja", href: "/shopping", icon: ShoppingCart, color: "bg-orange-100 text-orange-600" },
  { name: "Reminder", href: "/reminders", icon: Bell, color: "bg-blue-100 text-blue-600" },
  { name: "Kalkulator", href: "/calculator", icon: Calculator, color: "bg-[#fff0f4] text-[#e8849e]" },
];

export function QuickActions() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
      {quickActions.map((action) => (
        <Link
          key={action.name}
          href={action.href}
          className="flex-shrink-0"
        >
          <div className="flex flex-col items-center gap-1.5 w-16 sm:w-20">
            <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center`}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium text-gray-700 text-center">{action.name}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
