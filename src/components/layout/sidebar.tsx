"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  StickyNote,
  ShoppingCart,
  Bell,
  DollarSign,
  LogOut,
  Wallet,
  Menu,
  X,
  User,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Kalkulator", href: "/calculator", icon: Calculator },
  { name: "Catatan", href: "/notes", icon: StickyNote },
  { name: "Belanja", href: "/shopping", icon: ShoppingCart },
  { name: "Reminder", href: "/reminders", icon: Bell },
  { name: "Keuangan", href: "/finance", icon: DollarSign },
  { name: "Profil", href: "/profile", icon: User },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Close sidebar on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-container-lowest shadow-card border border-outline-variant/60"
        aria-expanded={isOpen}
        aria-controls="sidebar"
        aria-label={isOpen ? "Tutup menu" : "Buka menu"}
      >
        {isOpen ? (
          <X className="h-5 w-5 text-on-surface" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5 text-on-surface" aria-hidden="true" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        ref={sidebarRef}
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-surface-container-lowest border-r border-outline-variant/40 transform transition-transform duration-200 ease-in-out lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        role="navigation"
        aria-label="Navigasi sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant/40">
            <div className="w-9 h-9 rounded-xl bg-gradient-pink flex items-center justify-center shadow-card">
              <Wallet className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-primary-text">
              WeWallet
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary-text bg-primary-fixed"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary-text" : "text-on-surface-variant")} aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-outline-variant/40">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-error transition-colors"
              aria-label="Keluar dari akun"
            >
              <LogOut className="h-5 w-5 text-on-surface-variant" aria-hidden="true" />
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
