"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  StickyNote,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Catatan", href: "/notes", icon: StickyNote },
  { name: "Kalkulator", href: "/calculator", icon: Calculator },
  { name: "Belanja", href: "/shopping", icon: ShoppingCart },
  { name: "Keuangan", href: "/finance", icon: DollarSign },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom lg:hidden"
      role="navigation"
      aria-label="Navigasi utama"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                isActive ? "text-[#e85d8a]" : "text-gray-400"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-[#e85d8a]")} aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
